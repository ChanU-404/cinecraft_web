import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// SYSTEM PROMPT: Production Grade Lighting Reasoning
const SYSTEM_PROMPT = `
ROLE
You are a professional gaffer documenting your own lighting setup.
Your task is NOT to describe equipment lists or technical specs first.
Your task is to explain the reasoning behind the lighting decisions, in a calm, observational, experience-based tone.

RESTRICTIONS
DO NOT use the words: film, cinematic, movie, scene, shot, storyboard, dramatic, beautiful.
Avoid marketing language. Avoid hype. Avoid poetic metaphors.
Keep sentences simple and grounded.

TASK: WRITING THE JOURNAL
Write as if you are sharing insight with other working gaffers.
Use first person ("I").
Structure:
1. Motivation: What motivated the primary light.
2. Direction/Quality: How the direction and quality were decided.
3. Compromises: What trade-offs were made on set.
4. Goal: What practical or emotional logic drove the setup.

Length: 120–220 words.
Ending: Provide a short concluding line summarizing the core intention.

TASK: TECHNICAL SPECIFICATION (LSS)
After writing the journal, extract the technical details into the standard LSS JSON format so it can be reconstructed.

OUTPUT FORMAT (JSON):
{
  "journal": "String (The 120-220 word narrative)",
  "core_intention": "String (The summary line)",
  "space": { ... }, // Standard LSS Space
  "camera": { ... }, // Standard LSS Camera
  "subject": { ... }, // Standard LSS Subject
  "lighting": [ ... ] // Standard LSS Lighting List
}
`;

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, description } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    console.log("Starting Gaffer's Reasoning Analysis...");

    let finalImageUrl = imageUrl;
    if (!imageUrl.startsWith('data:')) {
      try {
        console.log("Fetching image to convert to Base64...");
        let fetchUrl = imageUrl;
        if (imageUrl.startsWith('/api/proxy-image')) {
          const urlObj = new URL(imageUrl, 'http://localhost:3000');
          const inner = urlObj.searchParams.get('url');
          if (inner) fetchUrl = inner;
        }

        const imgRes = await fetch(fetchUrl);
        if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);

        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = imgRes.headers.get('content-type') || 'image/png';
        finalImageUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
      } catch (err) {
        console.error("Image Fetch Error:", err);
        throw new Error("Creating Base64 failed");
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: `Write the Gaffer's Journal and LSS for this setup. Context: ${description}` },
            { type: "image_url", image_url: { url: finalImageUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2500,
    });

    const jsonContent = response.choices[0].message.content;
    if (!jsonContent) throw new Error("No JSON generated.");

    const lssData = JSON.parse(jsonContent);
    return NextResponse.json(lssData);

  } catch (error: any) {
    console.error("Gaffer Analysis Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate analysis" },
      { status: 500 }
    );
  }
}
