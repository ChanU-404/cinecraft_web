export interface Position {
    x: number;
    y: number;
}

export interface FloorPlanCharacter {
    id: string;
    position: Position;
    pose: string; // e.g., "standing", "kneeling", "lying"
    groundContact: string[]; // e.g., ["feet"], ["torso"]
    facing: number; // degrees (0-360)
}

export interface FloorPlanObserver {
    id: string;
    type: "human" | "device";
    position: Position;
    height: number; // relative height (e.g. 1.0 = eye level, 0.1 = ground)
    viewDirection: number; // degrees
    fieldOfView: number; // degrees
}

export interface FloorPlanBoundary {
    type: "edge" | "obstacle";
    points: Position[];
}

export interface FloorPlanData {
    space: {
        width: number;
        height: number;
    };
    characters: FloorPlanCharacter[];
    observers: FloorPlanObserver[];
    boundaries: FloorPlanBoundary[];
    lights: FloorPlanLight[];
}

export interface FloorPlanLight {
    id: string;
    type: "fixture" | "modifier" | "prop";
    subtype?: string; // e.g., "600x", "ultrabounce"
    position: Position;
    facing: number;
    color?: string; // For UI labels e.g. "red"
    label?: string; // e.g. "6x6 Ultrabounce"
}
