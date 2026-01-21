'use server'

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateUserPlan(email: string, plan: string) {
    if (!['GUEST', 'MEMBER', 'PRO'].includes(plan)) {
        throw new Error("Invalid plan type");
    }

    await prisma.user.update({
        where: { email },
        data: { plan }
    });

    revalidatePath('/admin/experiments');
    revalidatePath('/');
}
