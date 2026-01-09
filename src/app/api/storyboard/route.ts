import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { shotId, sceneContext, shot } = await req.json();

        if (!shotId || !shot?.description) {
            return NextResponse.json(
                { error: 'Missing shotId or shot description' },
                { status: 400 }
            );
        }

        const { location, time, emotion } = sceneContext || {};
        const { type, camera, description } = shot;

        // Base Prompt Construction
        const basePrompt = `
Generate a cinematic storyboard frame. Film still, realistic lighting, monochrome or desaturated palette. No text, no UI.

Scene Context: ${location}, ${time}. Mood: ${emotion?.join(', ')}.
Shot: ${type} shot, ${camera} movement.
Action: ${description}
    `.trim();

        // Generate 3 Variants (Parallel Requests)
        // Variant A: Neutral
        const promptA = `${basePrompt}
    Style: Balanced composition, neutral angle, establishing the scene.`;

        // Variant B: Dramatic
        const promptB = `${basePrompt}
    Style: High contrast lighting, dramatic shadows, slightly lower angle, intense mood.`;

        // Variant C: Artistic
        const promptC = `${basePrompt}
    Style: Wide aesthetic, negative space, artistic framing, shallow depth of field.`;

        // Execute parallel generation
        const results = await Promise.all([
            openai.images.generate({
                model: "dall-e-3",
                prompt: promptA,
                n: 1,
                size: "1024x1024",
                response_format: "url",
            }),
            openai.images.generate({
                model: "dall-e-3",
                prompt: promptB,
                n: 1,
                size: "1024x1024",
                response_format: "url",
            }),
            openai.images.generate({
                model: "dall-e-3",
                prompt: promptC,
                n: 1,
                size: "1024x1024",
                response_format: "url",
            })
        ]);

        // Extract URLs safely
        const storyboards = results.map((res, idx) => ({
            variant: String.fromCharCode(65 + idx), // 'A', 'B', 'C'
            imageUrl: res.data?.[0]?.url || "" // Safe access
        })).filter(sb => sb.imageUrl !== ""); // Remove failed generations

        return NextResponse.json({ shotId, storyboards });

    } catch (error) {
        console.error('Storyboard generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate storyboards' },
            { status: 500 }
        );
    }
}
