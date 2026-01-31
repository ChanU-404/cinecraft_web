import prisma from './db';

const QUOTAS = {
    GUEST: { draft: 0, final: 0 },
    MEMBER: { draft: 80, final: 0 },
    PRO: { draft: 400, final: 0 },
};

export async function getUserPlan(email: string) {
    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, plan: 'MEMBER' }, // Default to MEMBER on first seen
    });
    return user.plan as keyof typeof QUOTAS;
}

export async function getCredits(email: string) {
    // Ensure user exists (auto-create for Google Login users if they hit this first)
    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, plan: 'MEMBER' },
    });

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Check if credits already exist
    const existingCredits = await prisma.monthlyCredit.findUnique({
        where: {
            userId_period: { userId: user.id, period }
        }
    });

    // If credits exist and have unlimited quota (999999), don't update limits
    const shouldUpdateLimits = !existingCredits ||
        (existingCredits.draftLimit !== 999999 && existingCredits.finalLimit !== 999999);

    const credits = await prisma.monthlyCredit.upsert({
        where: {
            userId_period: { userId: user.id, period }
        },
        update: shouldUpdateLimits ? {
            draftLimit: QUOTAS[user.plan as keyof typeof QUOTAS].draft,
            finalLimit: QUOTAS[user.plan as keyof typeof QUOTAS].final,
        } : {},
        create: {
            userId: user.id,
            period,
            draftLimit: QUOTAS[user.plan as keyof typeof QUOTAS].draft,
            finalLimit: QUOTAS[user.plan as keyof typeof QUOTAS].final,
        }
    });

    // Fallback if DB returns partial data (rare but leads to 0/0)
    if (!credits.draftLimit) {
        return { ...credits, draftLimit: 80 };
    }

    return credits;
}

export async function checkCredits(email: string, type: 'draft' | 'final') {
    const credits = await getCredits(email);
    if (!credits) return false;

    const used = type === 'draft' ? credits.draftUsed : credits.finalUsed;
    const limit = type === 'draft' ? credits.draftLimit : credits.finalLimit;

    return used < limit;
}

export async function consumeCredits(email: string, type: 'draft' | 'final', amount: number = 1) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return false;

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (type === 'draft') {
        await prisma.monthlyCredit.update({
            where: { userId_period: { userId: user.id, period } },
            data: { draftUsed: { increment: amount } }
        });
    } else {
        await prisma.monthlyCredit.update({
            where: { userId_period: { userId: user.id, period } },
            data: { finalUsed: { increment: amount } }
        });
    }
    return true;
}
