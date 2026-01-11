export interface CastMember {
    id: string; // Added ID for editing
    name: string;
    role: string;
    character: string;
    callTime?: string;
    pickupTime?: string;
}

export interface DaySchedule {
    dayNumber: number;
    date: string;
    location: string;
    scenes: SceneSummary[];
    weather?: string;
    sunrise?: string;
    sunset?: string;
    notes?: string;
}

export interface SceneSummary {
    id: string; // Unique ID for table editing
    sceneId: string;
    time: string; // Time Block e.g. "08:00 - 09:00"
    intExt: string; // INT or EXT
    location: string;
    dayNight: string; // DAY or NIGHT
    description: string;
    pages: string; // e.g. "1/8"
    castIds: string[]; // e.g. ["1", "3", "5"]
    props?: string;
    notes?: string;
}

export interface CallSheetData {
    productionTitle: string;
    date: string;
    dayNumber: number;
    totalDays: number;
    callTime: string;
    crewCallTime: string;
    meetingPoint: string;
    locations: {
        basecamp: string;
        set: string;
        hospital: string;
    };
    weather: {
        forecast: string;
        tempHigh: string;
        tempLow: string;
        sunrise: string;
        sunset: string;
    };
    emergencyContact: {
        name: string;
        phone: string;
    };
    scenes: SceneSummary[];
    cast: CastMember[];
}

export interface ShootingScheduleData {
    days: DaySchedule[];
}
