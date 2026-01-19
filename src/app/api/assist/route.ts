import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';



const SYSTEM_PROMPT = `
You are a Screenplay Visualization Assistant. Your role is to help a director refine their shot list and storyboard plan.
You have access to the current scene and its shots.
The user will ask you to modify the plan (e.g., "Split this shot", "Change the angle", "Make it darker").

You can respond with two things:
1. A text explanation of what you did or a question.
2. A list of "operations" to perform on the shot list.

AVAILABLE OPERATIONS:
- type: 'UPDATE_SHOT'
  id: string (shot id)
  updates: object (fields to update: description, type, camera)
- type: 'SPLIT_SHOT'
  id: string (shot id to split)
  newShots: array of objects (full shot objects: id, type, camera, description)
- type: 'ADD_SHOT'
  afterId: string (shot id to add after)
  shot: object (full shot object)
- type: 'DELETE_SHOT'
  id: string

Output JSON format:
{
    "reply": "I've updated the shot to be a close-up...",
    "operations": [ ... ]
}
`.trim();

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const { messages, scene, shots } = await req.json();

    // Construct context
    const contextMsg = `
Current Scene: ${scene.location}
Shots:
${JSON.stringify(shots, null, 2)}
        `.trim();

    const fullMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: contextMsg },
      ...messages
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: fullMessages,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response from AI");

    return NextResponse.json(JSON.parse(content));

  } catch (error) {
    console.error('Assistant error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
