import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkCredits, consumeCredits } from "@/lib/credits";

// Helper to translate film terms to drawing instructions
function getComposition(type: string) {
    const t = type.toLowerCase();
    if (t.includes('close')) return "Focus tightly on the face or main object. Crop out the background.";
    if (t.includes('medium')) return "Draw the character from waist up. Show some background.";
    if (t.includes('wide') || t.includes('long')) return "Draw the full figure and the surrounding environment. Show where they are.";
    if (t.includes('extreme close')) return "Macro view. Zoom in on a specific detail (eye, hand, object).";
    return "Standard composition.";
}

function getPerspective(cam: string) {
    const c = cam.toLowerCase();
    if (c.includes('low')) return "Draw from a worm's eye view (looking up from the ground).";
    if (c.includes('high')) return "Draw from a bird's eye view (looking down from above).";
    if (c.includes('pan') || c.includes('track')) return "Dynamic motion lines suggesting movement.";
    return "Eye-level perspective.";
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.FLUX_API_KEY || process.env.FIREWORKS_API_KEY;
        if (!apiKey) throw new Error("Missing FLUX_API_KEY or FIREWORKS_API_KEY");

        // 1. Authenticate and rate limit
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = session.user.email;
        const hasCredits = await checkCredits(email, 'draft');

        if (!hasCredits) {
            return NextResponse.json(
                { error: 'Insufficient credits. Please upgrade your plan.' },
                { status: 403 }
            );
        }

        const { shotId, sceneContext, shot, seed } = await req.json();

        if (!shotId || !shot?.description) {
            return NextResponse.json(
                { error: 'Missing shotId or shot description' },
                { status: 400 }
            );
        }

        const { location, time, emotion, directorIntent } = sceneContext || {};
        const { type, camera, description } = shot;

        const compositionNote = getComposition(type);
        const perspectiveNote = getPerspective(camera);

        // Base Prompt Construction - RAW VISUAL IDEA
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

        // 2. Call Fireworks API
        const response = await fetch("https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-1-schnell-fp8/text_to_image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "image/png",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                prompt: basePrompt,
                aspect_ratio: "16:9",
                guidance_scale: 3.5,
                num_inference_steps: 4,
                seed: seed !== undefined ? seed : 0
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Fireworks API Error:", response.status, errorText);
            if (errorText.includes("CONTENT_FILTERED")) {
                return NextResponse.json({ error: "Prompt was filtered by safety policy." }, { status: 400 });
            }
            throw new Error(`Fireworks API Failed: ${response.status}`);
        }

        const contentType = response.headers.get("content-type") || "";
        let base64Image = "";
        let respSeed = seed || 0;
        let respFinishReason = "SUCCESS";

        if (contentType.includes("application/json")) {
            const data = await response.json();
            // Fireworks JSON response typically has 'image' or 'base64' (array)
            base64Image = data.image || (data.base64 && data.base64[0]) || "";
            respSeed = data.seed ?? respSeed;
            respFinishReason = data.finishReason || respFinishReason;
        } else {
            // Binary response
            const buffer = await response.arrayBuffer();
            const b64 = Buffer.from(buffer).toString('base64');
            base64Image = `data:${contentType || 'image/png'};base64,${b64}`;
            // Extract metadata from headers if available
            const billingProps = response.headers.get("fireworks-billing-properties");
            if (billingProps) {
                try {
                    const props = JSON.parse(billingProps);
                    // could extract steps etc here
                } catch (e) { }
            }
        }

        // 3. Consume Credits
        // TODO: Log usage details (steps, seed, provider, model) to DB when table exists.
        // console.log(`[Usage] User: ${email}, Provider: fireworks, Model: flux-1-schnell-fp8, Steps: 4`);

        await consumeCredits(email, 'draft');

        // Return single image wrapped in array for compatibility or as new format
        // The plan said "Return the single image in `image` field".
        // But the frontend adaptation plan said "Wrap the single base64 image in an array".
        // Let's send the raw single image data and let frontend adapt, OR adapt here.
        // User request "C. 프론트엔드 연결 수정" implies frontend change.
        // "응답은 JSON으로: { image, id, seed, steps, finishReason }"

        return NextResponse.json({
            shotId,
            image: base64Image,
            seed: respSeed,
            steps: 4,
            finishReason: respFinishReason
        });

    } catch (error: any) {
        console.error('Storyboard generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate storyboards' },
            { status: 500 }
        );
    }
}
