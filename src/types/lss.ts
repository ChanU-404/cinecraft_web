export interface LSS_Space {
    type: string; // e.g. "Interior room"
    shape: string; // e.g. "Rectangular"
    size: string; // e.g. "Medium (6m x 8m)"
    ceilingHeight: string; // e.g. "Standard (2.7m)"
    practicalSources: string[]; // e.g. ["Central ceiling fixture"]
}

export interface LSS_Camera {
    position: string; // e.g. "Room centerline, rear third"
    height: string; // e.g. "Eye level (1.6m)"
    distanceToSubject: string; // e.g. "2.5~3m"
    lens: string; // e.g. "35-50mm"
    framing: string;
    viewingDirection: string;
}

export interface LSS_Subject {
    count: number;
    position: string;
    pose: string;
    lightingPriority: string; // e.g. "Face detail + Top down pressure"
}

export interface LSS_Light {
    id: string;
    name: string; // e.g. "Key Light" or "L1 - Central"
    type: "Practical" | "Motivated" | "Studio" | "Control";
    tool: string; // e.g. "600x", "Bounce"
    position: string; // e.g. "Camera-left, 45 degrees"
    height: string;
    distance: string;
    quality: string; // e.g. "Soft", "Hard"
    intensity?: string; // e.g. "Key -1 stop"
    purpose: string;
}

export interface LightingSpatialSpecification {
    space: LSS_Space;
    camera: LSS_Camera;
    subject: LSS_Subject;
    lighting: LSS_Light[];

    // New Gaffer's Reasoning Fields
    journal: string; // The first-person reasoning logical narrative
    core_intention: string; // A one-line summary of the intention
}
