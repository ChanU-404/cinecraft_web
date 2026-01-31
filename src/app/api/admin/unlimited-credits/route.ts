import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        // 간단한 인증 (프로덕션에서는 더 강력한 인증 필요)
        const { secret, emails } = await request.json();

        // 환경 변수로 설정된 시크릿 키 확인
        if (secret !== process.env.ADMIN_SECRET) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const now = new Date();
        const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const results = [];

        for (const email of emails) {
            // 사용자 찾기
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                results.push({
                    email,
                    success: false,
                    message: 'User not found'
                });
                continue;
            }

            // 현재 크레딧 상태 확인
            let credit = await prisma.monthlyCredit.findFirst({
                where: {
                    userId: user.id,
                    period: currentPeriod
                }
            });

            if (credit) {
                // 기존 크레딧 업데이트
                credit = await prisma.monthlyCredit.update({
                    where: { id: credit.id },
                    data: {
                        draftLimit: 999999,
                        finalLimit: 999999,
                        draftUsed: 0,
                        finalUsed: 0
                    }
                });
            } else {
                // 새 크레딧 생성
                credit = await prisma.monthlyCredit.create({
                    data: {
                        userId: user.id,
                        period: currentPeriod,
                        draftLimit: 999999,
                        finalLimit: 999999,
                        draftUsed: 0,
                        finalUsed: 0
                    }
                });
            }

            results.push({
                email,
                success: true,
                draftLimit: credit.draftLimit,
                finalLimit: credit.finalLimit
            });
        }

        return NextResponse.json({
            success: true,
            period: currentPeriod,
            results
        });

    } catch (error) {
        console.error('Error setting unlimited credits:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
