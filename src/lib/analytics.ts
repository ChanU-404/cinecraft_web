// Google Analytics 이벤트 추적 함수

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// 페이지뷰 추적
export const pageview = (url: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', GA_MEASUREMENT_ID!, {
            page_path: url,
        });
    }
};

// 커스텀 이벤트 추적
interface EventParams {
    action: string;
    category?: string;
    label?: string;
    value?: number;
}

export const event = ({ action, category, label, value }: EventParams) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }
};

// 자주 사용하는 이벤트들을 미리 정의
export const trackEvent = {
    // 로그인 관련
    loginButtonClick: () => event({ action: 'login_button_click', category: 'Authentication' }),
    googleSignInClick: () => event({ action: 'google_signin_click', category: 'Authentication' }),
    signupComplete: (email: string) => event({ action: 'signup_complete', category: 'Authentication', label: email }),

    // 파일 업로드
    pdfUploadStart: () => event({ action: 'pdf_upload_start', category: 'Upload' }),
    pdfUploadComplete: (sceneCount: number) => event({ action: 'pdf_upload_complete', category: 'Upload', value: sceneCount }),

    // 스토리보드
    storyboardGenerateClick: () => event({ action: 'storyboard_generate_click', category: 'Storyboard' }),
    storyboardGenerateComplete: () => event({ action: 'storyboard_generate_complete', category: 'Storyboard' }),

    // 프로덕션
    productionScheduleStart: () => event({ action: 'production_schedule_start', category: 'Production' }),
    productionScheduleComplete: () => event({ action: 'production_schedule_complete', category: 'Production' }),
    productionPdfDownload: () => event({ action: 'production_pdf_download', category: 'Production' }),

    // 프로 구독
    upgradeModalOpen: () => event({ action: 'upgrade_modal_open', category: 'Subscription' }),
    waitlistJoinClick: () => event({ action: 'waitlist_join_click', category: 'Subscription' }),
    waitlistJoinComplete: (email: string) => event({ action: 'waitlist_join_complete', category: 'Subscription', label: email }),

    // 기타
    exportPdf: () => event({ action: 'export_pdf', category: 'Export' }),
    exportXlsx: () => event({ action: 'export_xlsx', category: 'Export' }),
};

// TypeScript 타입 선언
declare global {
    interface Window {
        gtag: (
            command: 'config' | 'event',
            targetId: string,
            config?: Record<string, any>
        ) => void;
    }
}
