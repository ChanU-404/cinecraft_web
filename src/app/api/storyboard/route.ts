import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';



export async function POST(req: NextRequest) {
    try {
        if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const { shotId, sceneContext, shot } = await req.json();

        if (!shotId || !shot?.description) {
            return NextResponse.json(
                { error: 'Missing shotId or shot description' },
                { status: 400 }
            );
        }

        const { location, time, emotion, directorIntent, contextSummary } = sceneContext || {};
        const { type, camera, description } = shot;

        // Helper to translate film terms to drawing instructions
        const getComposition = (type: string) => {
            const t = type.toLowerCase();
            if (t.includes('close')) return "Focus tightly on the face or main object. Crop out the background.";
            if (t.includes('medium')) return "Draw the character from waist up. Show some background.";
            if (t.includes('wide') || t.includes('long')) return "Draw the full figure and the surrounding environment. Show where they are.";
            if (t.includes('extreme close')) return "Macro view. Zoom in on a specific detail (eye, hand, object).";
            return "Standard composition.";
        };

        const getPerspective = (cam: string) => {
            const c = cam.toLowerCase();
            if (c.includes('low')) return "Draw from a worm's eye view (looking up from the ground).";
            if (c.includes('high')) return "Draw from a bird's eye view (looking down from above).";
            if (c.includes('pan') || c.includes('track')) return "Dynamic motion lines suggesting movement.";
            return "Eye-level perspective.";
        };

        const compositionNote = getComposition(type);
        const perspectiveNote = getPerspective(camera);

        // Base Prompt Construction - FINAL CORE INSTRUCTION (SKETCH ONLY)
        const basePrompt = `
Task: Quick rough sketch for a director's notebook.
Subject: ${description}
Context: ${location}, ${time}. Mood: ${emotion?.join(', ')}.

CONTROL SIGNAL:
${directorIntent ? `>>> ${directorIntent.toUpperCase()} <<<` : 'None.'}

VISUAL STYLE (MANDATORY):
- LOOK LIKE: A quick pencil or charcoal drawing on a napkin or notebook.
- LINES: Rough, loose, messy, energetic. Not perfect.
- SHADING: Hatching or simple block shading. No smooth digital gradients.
- NO: No polished "concept art", no "illustration", no "digital painting".

CONTENT RULES (PHYSICS > AESTHETICS):
1. ANATOMY: If the text says "awkward pose", draw it awkward. Do not fix it.
2. CONTACT: If touching the ground, show the weight pressing down.
3. CAMERA: Draw from the perspective described (${perspectiveNote}), but DO NOT DRAW THE CAMERA ITSELF.

ABSOLUTE FORBIDDEN LIST (NEVER INCLUDE):
- NO TEXT (Labels, dialog bubbles, captions).
- NO FRAMES (Panel borders, film sprocket holes, slide mounts).
- NO UI (Camera HUD, REC button, battery icon).
- NO "CINEMATIC" LIGHTING (No lens flares, no bokeh, no dramatic rim light unless physically justified).
- NO DRAWING TOOLS (No hands holding pencils).

Just the raw visual idea. Nothing else.
    `.trim();

        // Generate 3 variations in parallel
        const generateImage = async () => {
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: basePrompt,
                n: 1,
                size: "1024x1024",
                response_format: "url",
            });
            return response.data?.[0]?.url;
        };

        const results = await Promise.allSettled([
            generateImage(),
            generateImage(),
            generateImage()
        ]);

        const storyboards = results
            .map((res, index) => {
                if (res.status === 'fulfilled' && res.value) {
                    return { variant: String.fromCharCode(65 + index), imageUrl: res.value };
                }
                return null;
            })
            .filter(item => item !== null);

        if (storyboards.length === 0) {
            throw new Error("Failed to generate any images");
        }

        return NextResponse.json({ shotId, storyboards });

    } catch (error) {
        console.error('Storyboard generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate storyboards' },
            { status: 500 }
        );
    }
}
