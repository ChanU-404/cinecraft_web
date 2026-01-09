export interface Shot {
    id: string;
    type: string;
    camera: string;
    duration: string;
    description: string;
}

export interface Scene {
    id: string;
    location: string;
    summary: string;
    emotion: string[];
    shots: Shot[];
}

export const scenes: Scene[] = [
    {
        id: "SCENE 01",
        location: "INT · CAFE · RAINY NIGHT",
        summary: "비 내리는 밤, 텅 빈 카페에서 주인공 '준우'가 누군가를 기다리며 초조하게 시계를 확인한다.",
        emotion: ["Anxiety", "Loneliness"],
        shots: [
            {
                id: "S01-SH01",
                type: "ECU",
                camera: "Static",
                duration: "3s",
                description: "테이블 위, 얼음이 다 녹아버린 커피잔 표면에 맺힌 물방울이 아래로 굴러 떨어진다."
            },
            {
                id: "S01-SH02",
                type: "CU",
                camera: "Static",
                duration: "5s",
                description: "창밖을 응시하는 준우의 눈동자. 지나가는 자동차 헤드라이트 빛이 그의 눈에 반사되었다 사라진다."
            }
        ]
    },
    {
        id: "SCENE 02",
        location: "EXT · NARROW ALLEY · NIGHT",
        summary: "카페를 나선 준우가 좁은 골목길을 걷다 낯선 남자의 뒷모습을 발견하고 멈춰 선다.",
        emotion: ["Suspense", "Mystery"],
        shots: [
            {
                id: "S02-SH01",
                type: "WS",
                camera: "Dolly In",
                duration: "6s",
                description: "어두운 골목 끝, 가로등 아래 서 있는 검은 코트의 남자. 준우가 화면 안으로 들어오며 거리를 좁힌다."
            },
            {
                id: "S02-SH02",
                type: "OTS",
                camera: "Handheld",
                duration: "4s",
                description: "준우의 어깨 너머로 보이는 남자. 남자가 천천히 고개를 돌리려 하자 화면이 미세하게 흔들린다."
            }
        ]
    },
    {
        id: "SCENE 03",
        location: "INT · OLD ARCHIVE · DAWN",
        summary: "남자가 남긴 단서를 쫓아 찾아간 오래된 기록 보관소. 준우는 먼지 쌓인 서류 뭉치 속에서 결정적인 사진을 찾아낸다.",
        emotion: ["Discovery", "Cold"],
        shots: [
            {
                id: "S03-SH01",
                type: "MS",
                camera: "Pan",
                duration: "7s",
                description: "천장까지 닿을 듯한 서가 사이를 지나는 준우의 손길. 손끝이 닿는 곳마다 먼지구름이 피어오른다."
            },
            {
                id: "S03-SH02",
                type: "POV",
                camera: "Static",
                duration: "5s",
                description: "황변된 서류 더미 사이에서 발견된 낡은 폴라로이드 사진 한 장. 사진 속 인물의 얼굴이 서서히 선명해진다."
            }
        ]
    },
    {
        id: "SCENE 04",
        location: "EXT · ROOFTOP · DAY",
        summary: "진실을 마주한 준우가 탁 트인 옥상에서 도시를 내려다보며 복잡한 심경을 정리한다.",
        emotion: ["Clarity", "Melancholy"],
        shots: [
            {
                id: "S04-SH01",
                type: "LS",
                camera: "Crane Up",
                duration: "8s",
                description: "옥상 난간에 기대 선 준우의 뒷모습에서 시작해, 광활하게 펼쳐진 회색빛 도시 전경으로 카메라가 상승한다."
            }
        ]
    },
    {
        id: "SCENE 05",
        location: "INT · SUBWAY STATION · SUNSET",
        summary: "결심을 굳힌 준우가 노을 지는 승강장에서 전동차에 몸을 싣는다. 새로운 여정의 시작.",
        emotion: ["Resolve", "Hope"],
        shots: [
            {
                id: "S05-SH01",
                type: "MS",
                camera: "Tracking",
                duration: "6s",
                description: "플랫폼으로 진입하는 전동차의 강렬한 소음과 바람. 준우가 인파 사이를 뚫고 문 앞에 선다."
            },
            {
                id: "S05-SH02",
                type: "CU",
                camera: "Static",
                duration: "4s",
                description: "열차 유리창에 비친 준우의 얼굴. 예전과는 다른 단단한 눈빛이 노을빛을 받아 부드럽게 빛난다."
            }
        ]
    }
];
