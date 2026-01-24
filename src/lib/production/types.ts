import { z } from 'zod';

// --- Sub-Schemas ---

export const ShootDaySchema = z.object({
    id: z.string().uuid(),
    date: z.string(), // YYYY-MM-DD
    callTime: z.string(), // HH:MM
    shootStartTime: z.string(),
    estimatedWrapTime: z.string(),
    mainLocation: z.object({
        name: z.string(),
        address: z.string().optional(),
        mapLink: z.string().optional(),
    }),
    weather: z.string().optional(),
});

export const ProductionSceneSchema = z.object({
    id: z.string(), // Links to internal Scene ID
    order: z.number(), // Shoot order
    sceneNumber: z.string(),
    sluglineTitle: z.string(),
    synopsis: z.string(),
    intExt: z.enum(['INT', 'EXT', 'I/E']),
    dayNight: z.enum(['DAY', 'NIGHT', 'DAWN', 'DUSK', 'MAGIC']),
    locationName: z.string(),
    cutCount: z.number(),
    estimatedDuration: z.number(), // minutes
    characters: z.array(z.string()),
    flags: z.object({
        mos: z.boolean().default(false),
        extras: z.boolean().default(false),
        stunts: z.boolean().default(false),
        vfx: z.boolean().default(false),
        companyMove: z.boolean().default(false),
    }),
    notes: z.string().optional(),
});

export const TimeBlockSchema = z.object({
    id: z.string().uuid(),
    seq: z.number(),
    time: z.string(), // HH:MM
    activityLabel: z.string(),
    location: z.string().optional(),
    type: z.enum(['scene', 'break', 'move', 'prep', 'wrap', 'other']),
    duration: z.number(), // minutes
    refSceneId: z.string().optional(), // If linked to a scene
    memo: z.string().optional(),
});

export const CastCallSchema = z.object({
    characterName: z.string(),
    actorName: z.string().optional(),
    callTime: z.string(),
    costume: z.string().optional(),
    makeup: z.string().optional(),
    props: z.string().optional(),
});

// --- Main Model ---

export const DailyScheduleSchema = z.object({
    id: z.string().uuid(),
    date: z.string(),
    dayNumber: z.number(),
    shootDay: ShootDaySchema,
    scenes: z.array(ProductionSceneSchema),
    timetable: z.array(TimeBlockSchema),
    castCalls: z.array(CastCallSchema),
    announcements: z.string().optional(),
});

export const ProductionDocSchema = z.object({
    id: z.string().uuid(),
    projectId: z.string(),
    version: z.number().default(1),
    lastModified: z.number(), // timestamp

    project: z.object({
        title: z.string(),
        episodeNumber: z.string().optional(),
        director: z.string().optional(),
        producer: z.string().optional(),
    }),

    // Multi-day structure
    days: z.array(DailyScheduleSchema),
});

export type ProductionDocModel = z.infer<typeof ProductionDocSchema>;
export type ProductionScene = z.infer<typeof ProductionSceneSchema>;
export type TimeBlock = z.infer<typeof TimeBlockSchema>;
export type CastCall = z.infer<typeof CastCallSchema>;
export type DailySchedule = z.infer<typeof DailyScheduleSchema>;

// --- Scheduler Options ---

export interface DailyConfig {
    date: string;
    callTime: string;
    maxHours: number;
}

export interface SchedulerOptions {
    dailyConfigs: DailyConfig[];
    lunchDuration: number; // minutes
    locationMap?: Record<string, string>;
}
