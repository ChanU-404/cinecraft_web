import { Project, Scene } from '@/context/ScreenplayContext';
import { ProductionDocModel, ProductionDocSchema, ProductionScene, TimeBlock } from './types';
import { v4 as uuidv4 } from 'uuid';

// --- Extractor ---

export function extractSceneData(scene: Scene, index: number): ProductionScene {
    // 1. Parse Header
    // Example: "INT. PIZZA SHOP - NIGHT"
    const header = scene.location.toUpperCase();

    let intExt: 'INT' | 'EXT' | 'I/E' = 'INT';
    if (header.includes('EXT')) intExt = 'EXT';
    else if (header.includes('I/E')) intExt = 'I/E';

    let dayNight: 'DAY' | 'NIGHT' = 'DAY'; // Default
    if (header.includes('NIGHT')) dayNight = 'NIGHT';
    else if (header.includes('DAWN')) dayNight = 'DAY'; // Simplified mapping

    // 2. Extract Characters (Naive: speakers in script blocks)
    const characters = Array.from(new Set(
        scene.script_blocks
            .filter(b => b.type === 'dialogue' && b.speaker)
            .map(b => b.speaker!.trim().toUpperCase())
    ));

    // 3. Flags and Complexity (Heuristic)
    const textContent = scene.script_blocks.map(b => b.text).join(' ').toLowerCase();
    const flags = {
        mos: false,
        extras: textContent.includes('crowd') || textContent.includes('customers') || textContent.includes('pedestrians'),
        stunts: textContent.includes('fight') || textContent.includes('fall') || textContent.includes('chase'),
        vfx: textContent.includes('green screen') || textContent.includes('cg'),
        companyMove: false // Cannot determine from text alone
    };

    // 4. Time Estimation (Base 15m + 3m/shot or 2m/block if no shots)
    let estimatedDuration = 15;
    const shotCount = scene.shots?.length || 0;

    if (shotCount > 0) {
        estimatedDuration += shotCount * 5; // 5 min per shot (setup + shoot)
    } else {
        // Fallback: estimate by text length
        estimatedDuration += Math.ceil(scene.script_blocks.length * 1.5);
    }

    // Adjust for complexity
    if (flags.stunts) estimatedDuration += 30;
    if (flags.vfx) estimatedDuration += 20;

    return {
        id: scene.id,
        order: index + 1,
        sceneNumber: String(index + 1), // Or parse from slugline if available
        sluglineTitle: scene.location,
        synopsis: scene.summary || "No synopsis available",
        intExt,
        dayNight,
        locationName: scene.location.split('-')[0].replace(/INT\.|EXT\./, '').trim(),
        cutCount: shotCount,
        estimatedDuration,
        characters,
        flags: { ...flags, mos: false },
        notes: ""
    };
}

// --- Scheduler (Heuristic) ---

// New options interface
export interface ScheduleOptions {
    date: string;
    callTime: string;
    maxHours?: number;
    lunchDuration?: number;
    days?: number;
    location?: string;
}

export function generateDraftSchedule(
    project: Project,
    scenes: Scene[],
    options: ScheduleOptions = { date: new Date().toISOString().split('T')[0], callTime: "07:00" }
): ProductionDocModel {
    const { date, callTime, lunchDuration = 60, location = "" } = options;

    // 1. Extract Scenes
    const prodScenes: ProductionScene[] = scenes.map((s, i) => extractSceneData(s, i));

    // 2. Sort Logic (Minimize Moves: Location -> INT/EXT -> Day/Night)
    // Note: In a real app, we might want to preserve script order or ask user. 
    // Here we implement "Block Shooting" optimization.
    /* 
       For MVP, let's keep it simple: 
       Group by Location Name first using a stable sort.
    */
    prodScenes.sort((a, b) => {
        if (a.locationName < b.locationName) return -1;
        if (a.locationName > b.locationName) return 1;
        // Then by Int/Ext
        if (a.intExt < b.intExt) return -1;
        if (a.intExt > b.intExt) return 1;
        return 0;
    });

    // Re-assign order based on shooting order
    prodScenes.forEach((s, i) => s.order = i + 1);

    // 3. Build Timetable
    const timetable: TimeBlock[] = [];
    let currentTime = timeToMinutes(callTime);

    // 3.1 Crew Call
    timetable.push(createTimeBlock("스태프 집합 (Crew Call)", currentTime, 0));

    // 3.2 Shoot Start (e.g. +60 mins prep)
    currentTime += 60;
    timetable.push(createTimeBlock("촬영 시작 (Shooting Start)", currentTime, 60));

    // 3.3 Add Scenes
    let accumulatedTime = 0;
    let currentLocation = "";

    prodScenes.forEach(scene => {
        // Company Move check
        if (currentLocation && currentLocation !== scene.locationName) {
            timetable.push(createTimeBlock("이동 (Company Move)", currentTime, 45, "Move to " + scene.locationName));
            currentTime += 45;
            accumulatedTime += 45;
        }
        currentLocation = scene.locationName;

        // Scene Block
        timetable.push({
            id: uuidv4(),
            seq: timetable.length + 1,
            time: minutesToTime(currentTime),
            activityLabel: `Scene ${scene.sceneNumber}: ${scene.sluglineTitle}`,
            location: scene.locationName,
            type: 'scene',
            duration: scene.estimatedDuration,
            refSceneId: scene.id,
            memo: scene.synopsis.substring(0, 50) + "..."
        });

        currentTime += scene.estimatedDuration;
        accumulatedTime += scene.estimatedDuration;

        // Meal Break Logic (e.g. after 4 hours of shooting)
        // Simplified: Insert lunch at 12:00 or after 4 hours
        // For MVP, just putting it fixed or ignoring auto-insertion for now to keep it editable.
    });

    // 3.4 Wrap
    timetable.push(createTimeBlock("촬영 종료 (Wrap / Estimated End)", currentTime, 30));
    currentTime += 30;

    // 4. Cast Calls (Simple summary)
    const uniqueActors = Array.from(new Set(prodScenes.flatMap(s => s.characters)));
    const castCalls = uniqueActors.map(name => ({
        characterName: name,
        callTime: callTime, // Default to call time
        costume: "",
        makeup: ""
    }));

    return {
        id: uuidv4(),
        projectId: project.id,
        version: 1,
        lastModified: Date.now(),
        project: {
            title: project.title,
            director: "My Director",
            producer: "My Producer"
        },
        shootDay: {
            id: uuidv4(),
            date,
            callTime,
            shootStartTime: minutesToTime(timeToMinutes(callTime) + 60),
            estimatedWrapTime: minutesToTime(currentTime),
            mainLocation: { name: location || (prodScenes[0]?.locationName || "TBD") }
        },
        scenes: prodScenes,
        timetable,
        castCalls,
        announcements: "안전 제일! 정숙 유지 부탁드립니다. (Safety first!)"
    };
}

// --- Helpers ---

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function createTimeBlock(label: string, timeMin: number, duration: number, memo?: string): TimeBlock {
    return {
        id: uuidv4(),
        seq: 0, // Assigned later if needed
        time: minutesToTime(timeMin),
        activityLabel: label,
        type: 'other',
        duration,
        memo
    };
}
