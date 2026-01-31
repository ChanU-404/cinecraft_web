// 특정 사용자에게 무제한 토큰 부여 스크립트
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setUnlimitedCredits(emails: string[]) {
    try {
        const now = new Date();
        const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        console.log(`🔄 현재 기간: ${currentPeriod}`);
        console.log(`📧 대상 이메일: ${emails.join(', ')}\n`);

        for (const email of emails) {
            console.log(`\n처리 중: ${email}`);

            // 사용자 찾기
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                console.log(`❌ 사용자를 찾을 수 없습니다: ${email}`);
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
                console.log(`✅ ${email} - 크레딧 업데이트 완료`);
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
                console.log(`✅ ${email} - 새 크레딧 생성 완료`);
            }

            console.log(`   📊 Draft: ${credit.draftUsed}/${credit.draftLimit}`);
            console.log(`   📊 Final: ${credit.finalUsed}/${credit.finalLimit}`);
        }

        console.log('\n\n🎉 모든 작업이 완료되었습니다!');

    } catch (error) {
        console.error('❌ 오류 발생:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// 실행
const targetEmails = [
    'ieugenie@naver.com',
    'chanu3371@naver.com'
];

setUnlimitedCredits(targetEmails);
