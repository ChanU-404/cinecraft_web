
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkCredits, consumeCredits } from "@/lib/credits";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function refinePromptWithLLM(description: string, context: any, shot: any) {
    const { location, time, emotion, directorIntent, sceneGlobalContext, projectGlobalContext } = context;
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
    
    GLOBAL CONTEXT / DIRECTOR'S NOTE (CRITICAL - HIGHEST PRIORITY):
    The "Director's Note" below is the SUPREME LAW. It overrides ANY conflicting information in the script description or character names.
    
    - Project Style/Director's Note: ${projectGlobalContext || "None"}
    - Scene Context: ${sceneGlobalContext || "None"}
    
    CRITICAL INSTRUCTION - CHARACTER SUBSTITUTION:
    If the Director's Note redefines a character (e.g., "The alien is actually a human man", "The detective is a cat"), you must PHYSICALLY REPLACE the character in your visual description.
    - DO NOT write "An alien who looks like a man".
    - WRITE "A human man". 
    - STRIP OUT the original script word (e.g. "Alien") completely if it contradicts the Director's Note.
    
    If the Style is defined (e.g. "Cyberpunk", "Noir"), start the prompt with that style keyword.

    Output Format: return ONLY the English prompt string.
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
            "Accept": "image/jpeg",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const txt = await response.text();
        console.error(`Fireworks API Error ${response.status}: ${txt}`);
        throw new Error(`Fireworks API Error (${response.status}): ${txt}`);
    }

    const contentType = response.headers.get("content-type") || "";

    // 1. Handle Binary Image Response (Standard for Accept: image/jpeg)
    if (contentType.includes("image/")) {
        const buffer = await response.arrayBuffer();
        const b64 = Buffer.from(buffer).toString('base64');
        return `data:${contentType};base64,${b64}`;
    }

    // 2. Handle JSON Response (Fallback or specific error cases)
    else if (contentType.includes("application/json")) {
        const data = await response.json();

        let b64 = "";
        if (data.base64) {
            b64 = Array.isArray(data.base64) ? data.base64[0] : data.base64;
        } else if (data.image) {
            b64 = data.image;
        } else if (data.images && Array.isArray(data.images)) {
            b64 = data.images[0]?.base64 || data.images[0]?.url || "";
        }

        if (!b64) {
            console.error("Fireworks response missing image data:", JSON.stringify(data).slice(0, 200));
            throw new Error("Invalid response format from AI provider");
        }

        if (!b64.startsWith("data:image")) {
            return `data:image/jpeg;base64,${b64}`;
        }
        return b64;
    } else {
        // Unknown content type, attempt binary read
        console.warn(`Unknown content type: ${contentType}, attempting binary read`);
        const buffer = await response.arrayBuffer();
        const b64 = Buffer.from(buffer).toString('base64');
        return `data:image/jpeg;base64,${b64}`;
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
        const hasCredits = await checkCredits(email, 'draft');

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

            // 4. Consume Credits (3 Credits = 3 Candidate Images)
            await consumeCredits(email, 'draft', 3);

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
