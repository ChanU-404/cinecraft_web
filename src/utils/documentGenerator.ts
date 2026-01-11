import { Scene } from "@/context/ScreenplayContext";
import { CallSheetData, ShootingScheduleData, SceneSummary, DaySchedule, CastMember } from "@/types/production";
import { v4 as uuidv4 } from 'uuid'; // We need IDs for editing

// Helper to add minutes to a time string "HH:MM"
function addTime(timeStr: string, minutes: number): string {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toTimeString().slice(0, 5);
}

// Helper to parse various time formats (e.g. "7am", "09:00", "9") into "HH:MM"
function parseTime(input: string): string {
    if (!input) return "07:00";
    const clean = input.toLowerCase().replace(/[^0-9:]/g, ''); // keep numbers and colon

    // Handle "0700" or simple numbers
    if (!clean.includes(':')) {
        if (clean.length <= 2) return `${clean.padStart(2, '0')}:00`; // "9" -> "09:00"
        if (clean.length === 3) return `0${clean[0]}:${clean.slice(1)}`; // "930" -> "09:30"
        if (clean.length === 4) return `${clean.slice(0, 2)}:${clean.slice(2)}`; // "1300" -> "13:00"
    }

    // Handle "9:30" -> "09:30"
    const parts = clean.split(':');
    if (parts.length === 2) {
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }

    return "07:00"; // Fallback
}

export function generateProductionDocuments(
    projectTitle: string,
    scenes: Scene[],
    answers: Record<string, string>
): { callSheet: CallSheetData; schedule: ShootingScheduleData } {

    // 1. Parse 1st AD Answers (Strictly use answers if available)
    // We intentionally don't default to hard assumptions if the user provided data.
    const callTime = parseTime(answers.call_time || "08:00");
    const wrapTimeLimit = parseInt(answers.wrap_time) || 12;
    const avgDurationStr = answers.avg_duration || ""; // will infer default logic if empty
    const startSceneId = answers.first_scene || "";

    // Determine duration in minutes
    let durationPerScene = 60; // Default
    if (avgDurationStr.includes("30")) durationPerScene = 40;
    if (avgDurationStr.includes("Under")) durationPerScene = 25;
    if (avgDurationStr.includes("2+")) durationPerScene = 120;

    // 2. Sort Scenes (Priority Logic)
    let sortedScenes = [...scenes];
    if (startSceneId) {
        // clean input ID
        const targetId = startSceneId.trim();
        const priorityIndex = sortedScenes.findIndex((s, idx) =>
            s.id.includes(targetId) ||
            ((s as any).sceneNumber || (idx + 1)).toString() === targetId
        );
        if (priorityIndex > -1) {
            const [item] = sortedScenes.splice(priorityIndex, 1);
            sortedScenes.unshift(item);
        }
    }

    // 3. Generate Schedule (Strict Time Block Logic)
    let currentTime = callTime;

    const sceneSummaries: SceneSummary[] = sortedScenes.map((s, idx) => {
        const startTime = currentTime;
        const endTime = addTime(currentTime, durationPerScene);
        const timeBlock = `${startTime} - ${endTime}`;
        currentTime = endTime; // update for next scene

        // Fallback for scene number if not present in type
        const sceneNum = (s as any).sceneNumber || (idx + 1);

        return {
            id: uuidv4(),
            sceneId: `SCENE ${sceneNum}`,
            time: timeBlock,
            intExt: s.location.toUpperCase().includes("EXT") ? "EXT" : "INT",
            location: s.location, // Keep original location text
            dayNight: s.time,
            description: s.summary || "No description provided.",
            pages: "1/8", // Placeholder or from data
            castIds: ["Cast A", "Cast B"],
            props: "Standard Props",
            notes: ""
        };
    });

    // Simple 1-Day Logic
    const days: DaySchedule[] = [];
    const estimatedWrap = addTime(callTime, sceneSummaries.length * durationPerScene + 60); // +60 for lunch

    days.push({
        dayNumber: 1,
        date: new Date().toISOString().split('T')[0],
        location: answers.location_count ? `${answers.location_count} Locations` : "Main Set",
        scenes: sceneSummaries,
        weather: "Sunny / 24°C",
        sunrise: "06:30",
        sunset: "19:00",
        notes: `Estimated Wrap: ${estimatedWrap} (Limit: ${wrapTimeLimit}h)`
    });

    const schedule: ShootingScheduleData = { days };

    // 4. Generate Call Sheet (Day 1)
    const callSheet: CallSheetData = {
        productionTitle: projectTitle,
        date: new Date().toISOString().split('T')[0],
        dayNumber: 1,
        totalDays: 1,
        callTime: callTime,
        crewCallTime: callTime,
        meetingPoint: "Basecamp A",
        locations: {
            basecamp: "Basecamp A",
            set: sceneSummaries[0]?.location || "Main Set",
            hospital: "City General"
        },
        weather: {
            forecast: "Clear",
            tempHigh: "24C",
            tempLow: "15C",
            sunrise: "06:30",
            sunset: "19:00"
        },
        emergencyContact: {
            name: "Producer",
            phone: "000-0000-0000"
        },
        scenes: sceneSummaries,
        cast: [
            { id: uuidv4(), name: "Actor A", character: "Lead", role: "Main", callTime: addTime(callTime, 30), pickupTime: callTime },
            { id: uuidv4(), name: "Actor B", character: "Support", role: "Support", callTime: addTime(callTime, 60), pickupTime: addTime(callTime, 30) }
        ]
    };

    return { callSheet, schedule };
}
