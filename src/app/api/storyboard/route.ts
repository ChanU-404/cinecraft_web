
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkCredits, consumeCredits } from "@/lib/credits";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function refinePromptWithLLM(description: string, context: any, shot: any) {
    const { location, time, emotion, directorIntent } = context;
    const { type, camera } = shot;

    const systemPrompt = `
    You are an expert storyboard artist and cinematographer. 
    Your task is to convert a raw scene description (which may be in Korean) into a precise, high-quality ENGLISH visual prompt for an AI image generator (Flux.1).
    
    RULES:
    1. TRANSLATE strictly to English if input is Korean.
    2. VISUALS ONLY: Describe what is visible. No abstract concepts.
    3. CAMERA ANGLES: You MUST enforce the requested camera angle and shot type.
       - If "Close Up", describe facial features or details.
       - If "Wide Shot", describe the environment and full figures.
       - If "Low Angle", describe looking up at the subject.
    4. STYLE: "Rough pencil sketch, charcoal style, loose lines, energetic, storyboard format. Black and white."
    5. NEGATIVE: No text, no frames, no color, no photorealism.
    
    Output Format: Just the English prompt string.
    `;

    const userPrompt = `
    Context: ${location}, ${time}. Mood: ${emotion?.join(', ') || 'neutral'}.
    Director Intent: ${directorIntent || 'None'}
    
    SHOT SPECS:
    - Type: ${type} (CRITICAL)
    - Camera: ${camera} (CRITICAL)
    - Action: ${description}
    
    Generate the final visual prompt.
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            max_tokens: 200,
        });
        return completion.choices[0].message.content || description;
    } catch (e) {
        console.error("LLM Refinement Failed:", e);
        return description; // Fallback to raw description
    }
}

async function generateSingleImage(apiKey: string, prompt: string, seed: number) {
    const requestBody = {
        prompt: prompt,
        aspect_ratio: "16:9",
        seed: seed
    };

    const response = await fetch("https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-1-schnell-fp8/text_to_image", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "image/png", // Request binary for quality/speed
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Fireworks API Error (${response.status}): ${txt}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        const data = await response.json();
        return data.image || (data.base64 && data.base64[0]) || "";
    } else {
        const buffer = await response.arrayBuffer();
        const b64 = Buffer.from(buffer).toString('base64');
        return `data:${contentType || 'image/png'};base64,${b64}`;
    }
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.FLUX_API_KEY || process.env.FIREWORKS_API_KEY;
        if (!apiKey) throw new Error("Missing FLUX_API_KEY or FIREWORKS_API_KEY");

        // 1. Authenticate
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = session.user.email;
        let hasCredits = true;
        try {
            hasCredits = await checkCredits(email, 'draft');
        } catch (e) {
            console.warn("Credit Check Failed (DB Error), skipping check to allow generation.", e);
            hasCredits = true; // Fallback to allow generation if DB is down
        }

        if (!hasCredits) {
            return NextResponse.json({ error: 'Insufficient credits.' }, { status: 403 });
        }

        const { shotId, sceneContext, shot } = await req.json();

        if (!shotId || !shot?.description) {
            return NextResponse.json({ error: 'Missing Data' }, { status: 400 });
        }

        // 2. Refine Prompt (Korean -> English & Camera Specs)
        const refinedPrompt = await refinePromptWithLLM(shot.description, sceneContext, shot);
        console.log(`[Prompt Refined] ${shotId}: ${refinedPrompt}`);

        // 3. Generate 3 Variants in Parallel
        // Use different seeds to get variations
        const seeds = [Math.floor(Math.random() * 10000), Math.floor(Math.random() * 10000) + 1, Math.floor(Math.random() * 10000) + 2];

        try {
            const imagePromises = seeds.map(seed => generateSingleImage(apiKey, refinedPrompt, seed));
            const imagesBase64 = await Promise.all(imagePromises);

            const resultImages = imagesBase64.map((img, idx) => ({
                variant: String.fromCharCode(65 + idx), // A, B, C
                imageUrl: img
            }));

            // 4. Consume Credits (1 Credit per Batch Action)
            try {
                await consumeCredits(email, 'draft');
            } catch (e) {
                console.warn("Credit Consumption Failed (DB Error), ignoring.", e);
            }

            return NextResponse.json({
                shotId,
                images: resultImages
            });

        } catch (genError: any) {
            console.error("Generation Failed:", genError);
            if (genError.message.includes("content_filtered")) {
                return NextResponse.json({ error: "Content Filtered" }, { status: 400 });
            }
            throw genError;
        }

    } catch (error: any) {
        console.error('Storyboard generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate storyboards' },
            { status: 500 }
        );
    }
}
