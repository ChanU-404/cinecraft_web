export interface LightingElement {
    motivation: string;
    tool: string;
    quality: string;
    position: string;
    reason: string;
}

export interface NegativeFillElement {
    tool: string;
    position: string;
    reason: string;
}

export interface AdditionalElement {
    type: string;
    tool: string;
    position: string;
    reason: string;
}

export interface LightingBreakdown {
    key_light: LightingElement;
    fill: LightingElement;
    negative_fill: NegativeFillElement;
    additional_elements: AdditionalElement[];
}

export interface LightingAnalysisData {
    intent_summary: string[];
    breakdown: LightingBreakdown;
    floor_plan_notes: string;
}
