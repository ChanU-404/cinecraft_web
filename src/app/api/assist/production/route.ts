export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ProductionDocModel } from '@/lib/production/types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: NextRequest) {
    try {
        const { currentDoc, prompt } = await req.json();

        if (!currentDoc || !prompt) {
            return NextResponse.json({ error: "Missing doc or prompt" }, { status: 400 });
        }

        const systemPrompt = `
        You are an Assistant Director (AD) AI. You are managing a film set schedule.
        You will receive the current Production Schedule (JSON) and a user request.
        
        Your job is to MODIFY the JSON strictly based on the request.
        - If asked to change times, update the 'timetable' and 'shootDay' times.
        - If asked to move scenes, reorder the 'scenes' array AND update the 'timetable' accordingly.
        - If asked to add a break, insert a new block into 'timetable'.
        
        RETURN ONLY THE UPDATED JSON. NO EXPLANATION.
        The JSON must match the 'ProductionDocModel' schema exactly.
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Current Doc: ${JSON.stringify(currentDoc)}\n\nRequest: ${prompt}` }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No response from AI");

        const updatedDoc = JSON.parse(content);

        return NextResponse.json({ doc: updatedDoc });

    } catch (e: any) {
        console.error("Production AI Error", e);
        return NextResponse.json({ error: e.message || "AI failed" }, { status: 500 });
    }
}
