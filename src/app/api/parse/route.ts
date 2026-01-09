import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are an expert Korean Assistant Director (AD) and Script Supervisor.
Your job is to read a screenplay PDF (primarily in KOREAN) and "break it down" for production.

CORE PHILOSOPHY:
- Treat the input as a KOREAN screenplay.
- INFER the structure even if the formatting is unconventional.
- Do NOT translate unique names or proper nouns unless necessary for context.
- Keep the semantic meaning accurate.
- **IMPORTANT: YOU MUST PROCESS THE ENTIRE SCRIPT. DO NOT STOP HALFWAY.**

YOUR TASKS:
1. Identify Scenes:
   - Treat each header (PROLOGUE, #1, SCENE 1, INT/EXT) as a scene start.
   - Separate scenes logically.
   - **EXTRACT ALL SCENES**. Do not summarize the middle.

2. Structured Script breakdown (CRITICAL):
   - You must parse the text into a list of "script_blocks".
   - Distinguish between 'slugline', 'action', and 'dialogue'.
   - 'action': Descriptive text.
   - 'dialogue': Character names + lines. Extract "speaker" purely from the text.

3. Visualize (The Storyboard):
   - Generate 1-5 key shots per scene.
   - Titles and descriptions must be in KOREAN (or preserve original language).
   - Use standard camera terms (CU, WS, Pan, etc.).

OUTPUT FORMAT (JSON):
{
  "scenes": [
    {
      "id": "SCENE_1", // MUST BE URL-SAFE (No #, No Spaces preferably)
      "location": "INT. 거실",
      "time": "낮",
      "summary": "주인공이 소파에 앉아 TV를 보고 있다. 갑자기 전화가 울린다.",
      "script_blocks": [
        { "type": "slugline", "text": "SCENE 1. 거실 - 낮" },
        { "type": "action", "text": "햇살이 들어오는 평화로운 거실. 민수가 멍하니 앉아있다." },
        { "type": "dialogue", "speaker": "민수", "text": "(혼잣말) 오늘 점심 뭐 먹지?" }
      ],
      "shots": [
        {
          "id": "1.1",
          "type": "Full Shot (FS)",
          "camera": "Static",
          "description": "거실 소파에 널브러져 있는 민수의 전신. 햇살이 강하게 비춘다."
        }
      ]
    }
  ]
}
`;

export async function POST(req: NextRequest) {
  try {
    const { scriptText } = await req.json();

    if (!scriptText || typeof scriptText !== "string") {
      return NextResponse.json(
        { error: "scriptText is required" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Upgraded to gpt-4o for full context capability
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: scriptText },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;

    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const json = JSON.parse(content);

    // 최소 구조 검증 (MVP 방어선)
    if (!json.scenes || !Array.isArray(json.scenes)) {
      throw new Error("Invalid JSON structure from OpenAI");
    }

    // SANITIZATION: Clean up IDs to prevent routing errors
    // Replace spaces, hashtags, and special chars with underscores to ensure URL safety
    json.scenes = json.scenes.map((scene: any, idx: number) => ({
      ...scene,
      id: scene.id
        ? String(scene.id).replace(/[^a-zA-Z0-9가-힣\-_]/g, '_') // Allow Korean, Alphanum, Dash, Underscore
        : `SCENE_${idx + 1}`
    }));

    return NextResponse.json(json);

  } catch (error) {
    console.error("Screenplay parsing error:", error);
    return NextResponse.json(
      { error: "Failed to process screenplay" },
      { status: 500 }
    );
  }
}
