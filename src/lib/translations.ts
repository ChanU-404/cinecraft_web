export const translations = {
    en: {
        navbar: {
            features: "Features",
            solutions: "Solutions",
            pricing: "Pricing",
            docs: "Docs",
            getStarted: "Get Started",
            brand: "Antigravity"
        },
        sceneDetail: {
            returnToWorkspace: "Return to Workspace",
            scene: "Scene",
            fullProject: "Full Project",
            originalScriptContext: "Original Script Context",
            aiAssistantDirector: "AI Assistant Director",
            beta: "Beta",
            shotList: "Shot List",
            regenerateVisuals: "Regenerate Visuals",
            generating: "Generating Visuals...",
            generateVisuals: "Generate Visuals",
            storyboardSequence: "Storyboard Sequence",
            inSequence: "In Sequence",
            cover: "Cover",
            selectForSequence: "Select for Storyboard Sequence",
            setAsCover: "Set as Scene Thumbnail (Cover)"
        },
        globalContext: {
            title: "Global Context Settings",
            description: "Define consistent elements (characters, style, background) for all shots in this scene.",
            characterLabel: "Character / Subject",
            characterPlaceholder: "e.g. John is a tall man with a beard, wearing a red jacket.",
            backgroundLabel: "Background / World",
            backgroundPlaceholder: "e.g. Cyberpunk city at night, neon lights, rain.",
            styleLabel: "Art Style",
            stylePlaceholder: "e.g. Noir, rough pencil sketch, cinematic lighting.",
            save: "Save Context"
        }
    },
    ko: {
        navbar: {
            features: "기능",
            solutions: "솔루션",
            pricing: "가격",
            docs: "문서",
            getStarted: "시작하기",
            brand: "Antigravity"
        },
        sceneDetail: {
            returnToWorkspace: "워크스페이스로 돌아가기",
            scene: "씬",
            fullProject: "전체 프로젝트",
            originalScriptContext: "테스트 스크립트",
            aiAssistantDirector: "AI 조감독",
            beta: "베타",
            shotList: "샷 리스트",
            regenerateVisuals: "이미지 재생성",
            generating: "이미지 생성 중...",
            generateVisuals: "이미지 생성",
            storyboardSequence: "스토리보드 시퀀스",
            inSequence: "선택됨",
            cover: "대표",
            selectForSequence: "스토리보드에 추가",
            setAsCover: "대표 이미지로 설정"
        },
        globalContext: {
            title: "글로벌 컨텍스트 설정",
            description: "이 씬의 모든 샷에 적용될 공통 요소(캐릭터, 배경, 스타일)를 정의하세요.",
            characterLabel: "캐릭터 / 인물",
            characterPlaceholder: "예: 철수는 키가 크고 수염이 있으며 빨간 자켓을 입고 있다.",
            backgroundLabel: "배경 / 세계관",
            backgroundPlaceholder: "예: 사이버펑크 도시의 밤, 네온 사인, 비.",
            styleLabel: "화풍 / 스타일",
            stylePlaceholder: "예: 누아르, 거친 연필 스케치, 영화적 조명.",
            save: "설정 저장"
        }
    }
};

export type Language = 'en' | 'ko';
export type TranslationKey = keyof typeof translations.en;
