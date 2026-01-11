import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// SYSTEM PROMPT: Strict Spatial Logic Extraction
const SYSTEM_PROMPT = `
You are a Spatial Reasoning Engine for a filmmaking tool.
Your ONLY goal is to extract physical spatial data from a storyboard sketch.

You will receive an image and context.
Output valid JSON adhering to this schema:
{
  "space": { "width": number, "height": number }, // Assume a relevant 10x10m or similar area
  "characters": [
    {
      "id": "char1",
      "position": { "x": number, "y": number },
      "pose": "standing" | "kneeling" | "lying" | "sitting",
      "groundContact": ["feet", "knees", "hands", "torso", "head"],
      "facing": number // 0 = North/Up, 90 = East/Right
    }
  ],
  "observers": [
    {
      "id": "camera1",
      "type": "device",
      "position": { "x": number, "y": number },
      "height": number, // 0.0 (ground) to 2.0 (high)
      "viewDirection": number,
      "fieldOfView": number // e.g. 45 for standard, 90 for wide
    }
  ],
  "boundaries": [
    {
      "type": "edge" | "obstacle",
      "points": [{ "x": number, "y": number }]
    }
  ],
  "lights": [
    {
      "id": "light1",
      "type": "fixture" | "modifier" | "prop",
      "subtype": "600x",
      "position": { "x": number, "y": number },
      "facing": number,
      "label": "600x w/ F10"
    }
  ]
}

RULES:
1. Coordinate System: Top-Left is (0,0). X increases right, Y increases down.
2. Inference:
   - If character is "lying on road", pose="lying", height=0.
   - If camera is "low angle", observer height < 0.5.
   - If camera is "overhead", observer position might be same as character but height > 5.0.
3. Keep it simple. Only essential obstacles (walls, road edges).
4. NO MARKDOWN. OUTPUT RAW JSON ONLY.
5. Lighting Extraction:
   - Identify light fixtures (e.g. "600x", "M18", "Tungsten").
   - Identify modifiers (e.g. "Ultrabounce", "Grid", "Silk", "Solid").
   - Determine facing/direction of lights.
   - Assign colors/labels based on common set terminology (e.g. Green for bounce/grip, Yellow for fixtures).
`;

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, description } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    console.log("Starting Spatial Analysis...");

    // Robustness: Convert URL to Base64 to ensure OpenAI can read it
    let finalImageUrl = imageUrl;
    if (!imageUrl.startsWith('data:')) {
      try {
        console.log("Fetching image to convert to Base64:", imageUrl.substring(0, 50) + "...");

        // Handle local proxy URLs or relative paths
        let fetchUrl = imageUrl;

        // If it's a relative path (starts with /), prepend the origin
        if (imageUrl.startsWith('/')) {
          const host = req.headers.get('host') || 'localhost:3000';
          const protocol = req.headers.get('x-forwarded-proto') || 'http';
          fetchUrl = `${protocol}://${host}${imageUrl}`;
        }

        if (imageUrl.startsWith('/api/proxy-image')) {
          const urlObj = new URL(fetchUrl); // Use the fuller URL
          const inner = urlObj.searchParams.get('url');
          if (inner) {
            // If inner is also local/relative, we might need to handle it, but usually proxy handles external
            // For now, let's stick to fetching the proxy endpoint itself which returns the image
          }
        }

        console.log("Fetching from:", fetchUrl);
        const imgRes = await fetch(fetchUrl);
        if (!imgRes.ok) throw new Error(`Failed to fetch image from ${fetchUrl}: ${imgRes.status} ${imgRes.statusText}`);

        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = imgRes.headers.get('content-type') || 'image/png';
        finalImageUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
        console.log("Image converted to Base64 successfully.");
      } catch (err) {
        console.error("Image Fetch Error:", err);
        // Fallback: try sending original URL (propagate error if crucial)
        // throwing here is better so we know why it failed
        throw new Error("Creating Base64 failed: " + (err instanceof Error ? err.message : String(err)));
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this storyboard. Context: ${description}` },
            { type: "image_url", image_url: { url: finalImageUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const jsonContent = response.choices[0].message.content;

    if (!jsonContent) throw new Error("No JSON generated.");

    console.log("Spatial Data Generated:", jsonContent.substring(0, 100) + "...");

    const floorPlanData = JSON.parse(jsonContent);

    return NextResponse.json(floorPlanData);

  } catch (error: any) {
    console.error("Floor Plan JSON Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate floor plan data" },
      { status: 500 }
    );
  }
}
