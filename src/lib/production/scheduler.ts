import { Project, Scene } from '@/context/ScreenplayContext';
import { ProductionDocModel, ProductionDocSchema, ProductionScene, TimeBlock, DailySchedule } from './types';
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
    locationMap?: Record<string, string>;
}

export function generateDraftSchedule(
    project: Project,
    scenes: Scene[],
    options: ScheduleOptions = { date: new Date().toISOString().split('T')[0], callTime: "07:00" }
): ProductionDocModel {
    const { date: startDate, callTime, lunchDuration = 60, maxHours = 12, locationMap = {} } = options;
    const maxMinutesPerDay = maxHours * 60;
    const callTimeMinutes = timeToMinutes(callTime);

    // 1. Extract Scenes & Map Locations
    const prodScenes: ProductionScene[] = scenes.map((s, i) => {
        const extracted = extractSceneData(s, i);
        // Apply user mapped location if exists
        const mappedName = locationMap[extracted.locationName];
        if (mappedName) {
            extracted.locationName = mappedName; // Override with real world name
        }
        return extracted;
    });

    // 2. Sort Logic (Minimize Moves: Location -> INT/EXT -> Day/Night)
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

    // 3. Multi-Day Generation Loop
    const days: DailySchedule[] = [];
    const remainingScenes = [...prodScenes];

    let currentDayNum = 1;
    let currentDateStr = startDate;

    // Safety brake for while loop
    while (remainingScenes.length > 0 && currentDayNum <= (options.days || 10)) {
        const dayScenes: ProductionScene[] = [];
        const timetable: TimeBlock[] = [];
        let currentTime = callTimeMinutes;
        let dayDuration = 0;

        // 3.1 Crew Call
        timetable.push(createTimeBlock("스태프 집합 (Crew Call)", currentTime, 0));

        // 3.2 Shoot Start
        currentTime += 60; // Prep time
        dayDuration += 60;
        timetable.push(createTimeBlock("촬영 시작 (Shooting Start)", currentTime, 60));

        let currentLocation = "";
        let lunchTaken = false;

        // 3.3 Scene Packing for this Day
        let i = 0;
        while (i < remainingScenes.length) {
            const scene = remainingScenes[i];
            let moveTime = 0;

            // Check Company Move
            if (currentLocation && currentLocation !== scene.locationName) {
                moveTime = 45;
            }

            // Estimate total time for this scene inclusion
            const totalCost = moveTime + scene.estimatedDuration;

            // Check if fits in day
            if (dayDuration + totalCost > maxMinutesPerDay) {
                // Determine if we should split or push to next day.
                // For MVP, just push to next day unless it's the very first scene of day (then force it or Error).
                if (dayScenes.length === 0) {
                    // Force at least one scene per day to prevent infinite loop if scene > maxHours
                    // Fall through to add
                } else {
                    break; // End this day
                }
            }

            // Add Move Block
            if (moveTime > 0) {
                timetable.push(createTimeBlock("이동 (Company Move)", currentTime, moveTime, "Move to " + scene.locationName));
                currentTime += moveTime;
                dayDuration += moveTime;
            }
            currentLocation = scene.locationName;

            // Add Scene Block
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

            dayScenes.push(scene);
            currentTime += scene.estimatedDuration;
            dayDuration += scene.estimatedDuration;

            // Auto-Lunch: After 4 hours of shooting (240 mins) or near noon?
            // Simple logic: If dayDuration > 240 (4h) and not taken
            if (dayDuration > 240 && !lunchTaken) {
                timetable.push(createTimeBlock("점심 식사 (Lunch)", currentTime, lunchDuration));
                currentTime += lunchDuration;
                dayDuration += lunchDuration;
                lunchTaken = true;
            }

            // Remove from remaining
            remainingScenes.splice(i, 1);
            // Don't increment i because array shifted
        }

        // 3.4 Wrap
        timetable.push(createTimeBlock("촬영 종료 (Wrap / Estimated End)", currentTime, 30));

        // 3.5 Cast Calls for Day
        const uniqueActors = Array.from(new Set(dayScenes.flatMap(s => s.characters)));
        const castCalls = uniqueActors.map(name => ({
            characterName: name,
            callTime: callTime, // Just default to call time
            costume: "",
            makeup: ""
        }));

        // Push Day
        days.push({
            id: uuidv4(),
            date: currentDateStr,
            dayNumber: currentDayNum,
            shootDay: {
                id: uuidv4(),
                date: currentDateStr,
                callTime,
                shootStartTime: minutesToTime(callTimeMinutes + 60),
                estimatedWrapTime: minutesToTime(currentTime),
                mainLocation: { name: dayScenes[0]?.locationName || "TBD" }
            },
            scenes: dayScenes,
            timetable,
            castCalls,
            announcements: "안전 제일! 정숙 유지 부탁드립니다. (Safety first!)"
        });

        // Prepare next day
        currentDayNum++;
        const dateObj = new Date(currentDateStr);
        dateObj.setDate(dateObj.getDate() + 1);
        currentDateStr = dateObj.toISOString().split('T')[0];
    }

    // Force at least one day if empty (shouldnt happen)
    if (days.length === 0) {
        // Create empty placeholder day...
    }

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
        days: days
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
