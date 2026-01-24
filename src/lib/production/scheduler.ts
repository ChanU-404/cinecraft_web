import { Project, Scene } from '@/context/ScreenplayContext';
import { ProductionDocModel, ProductionDocSchema, ProductionScene, TimeBlock, DailySchedule, SchedulerOptions } from './types';
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
    if (flags.extras) estimatedDuration += 15;

    return {
        id: uuidv4(),
        order: index + 1,
        sluglineTitle: scene.location,
        locationName: scene.location.split('-')[0].trim(), // "INT. PIZZA" -> "INT. PIZZA"
        intExt,
        dayNight,
        estimatedDuration,
        characters,
        flags,
        status: 'not-started'
    };
}

// --- Main Scheduler ---

export function generateDraftSchedule(
    project: Project,
    scenes: Scene[],
    options: SchedulerOptions
): ProductionDocModel {
    const { dailyConfigs, lunchDuration, locationMap = {} } = options;

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

    // 3. Multi-Day Generation Loop using dailyConfigs
    const days: DailySchedule[] = [];
    const remainingScenes = [...prodScenes];

    let dayIndex = 0;

    // Process each day config
    for (const config of dailyConfigs) {
        if (remainingScenes.length === 0) break;

        const dayNumber = dayIndex + 1;
        const callTime = config.callTime;
        const maxMinutes = config.maxHours * 60;
        const callTimeMinutes = timeToMinutes(callTime);

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
            const sceneWithOverhead = scene.estimatedDuration + moveTime;

            // Check for lunch insertion
            if (!lunchTaken && dayDuration > 3 * 60) {
                // Insert lunch
                if (dayDuration + lunchDuration + sceneWithOverhead <= maxMinutes) {
                    timetable.push(createTimeBlock("점심 식사 (Lunch Break)", currentTime, lunchDuration));
                    currentTime += lunchDuration;
                    dayDuration += lunchDuration;
                    lunchTaken = true;
                } else {
                    // No space for lunch + scene, wrap day
                    break;
                }
            }

            // Check if scene fits
            if (dayDuration + sceneWithOverhead > maxMinutes) {
                break; // Cannot fit this scene, end day
            }

            // Add Move if needed
            if (moveTime > 0) {
                timetable.push(createTimeBlock(`이동 (Move to ${scene.locationName})`, currentTime, moveTime));
                currentTime += moveTime;
                dayDuration += moveTime;
            }

            // Add Scene
            timetable.push({
                id: uuidv4(),
                seq: timetable.length + 1,
                time: minutesToTime(currentTime),
                activityLabel: `Scene ${scene.order}: ${scene.sluglineTitle}`,
                type: 'scene',
                duration: scene.estimatedDuration,
                location: scene.locationName,
                refSceneId: scene.id,
                memo: `${scene.intExt}. ${scene.locationName} - ${scene.dayNight} | Cast: ${scene.characters.join(', ')}`
            });

            currentTime += scene.estimatedDuration;
            dayDuration += scene.estimatedDuration;
            currentLocation = scene.locationName;

            dayScenes.push(scene);
            remainingScenes.splice(i, 1); // Remove from remaining
        }

        if (dayScenes.length === 0) {
            // No scenes packed for this day, skip
            dayIndex++;
            continue;
        }

        // 3.4 Wrap
        timetable.push(createTimeBlock("촬영 종료 (Wrap)", currentTime, 30));
        currentTime += 30;
        const wrapTime = minutesToTime(currentTime);

        // 4. Cast Calls
        const uniqueCharacters = Array.from(new Set(dayScenes.flatMap(s => s.characters)));
        const castCalls = uniqueCharacters.map(char => ({
            characterName: char,
            actorName: "",
            callTime: callTime,
            costume: "",
            makeup: "",
            props: ""
        }));

        // 5. Determine Main Location
        const locationCounts: Record<string, number> = {};
        dayScenes.forEach(s => {
            locationCounts[s.locationName] = (locationCounts[s.locationName] || 0) + 1;
        });
        const mainLocationName = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "미정";

        // 6. Day Object
        days.push({
            id: uuidv4(),
            date: config.date,
            dayNumber,
            shootDay: {
                date: config.date,
                callTime: callTime,
                wrapTime: wrapTime,
                mainLocation: {
                    name: mainLocationName,
                    address: ""
                },
                weather: { forecast: "맑음 (Sunny)", tempRange: "15-25°C" },
                crew: {
                    director: project.director || "미정",
                    dop: "",
                    pd: "",
                    gaffer: "",
                    ad: ""
                }
            },
            timetable,
            castCalls,
            scenes: dayScenes,
            announcements: `Day ${dayNumber} 촬영 세부 사항`
        });

        dayIndex++;
    }

    // Build final document
    return {
        id: uuidv4(),
        projectId: project.id,
        version: 1,
        lastModified: Date.now(),
        project: {
            title: project.title,
            episodeNumber: "",
            director: project.director || "",
            producer: ""
        },
        days
    };
}

// Helper functions
function timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function createTimeBlock(label: string, timeMinutes: number, duration: number): TimeBlock {
    return {
        id: uuidv4(),
        seq: 0, // Will be updated in final pass
        time: minutesToTime(timeMinutes),
        activityLabel: label,
        type: 'other',
        duration,
        location: "",
        memo: ""
    };
}
