import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import path from "path";

export const maxDuration = 120;
export const runtime = "nodejs";

const MODEL = "gpt-image-2";
const ENDPOINT = "https://api.openai.com/v1/images/edits";

const DRINK_CATEGORIES = new Set(["cocktails", "beer", "coffee", "smoothies", "soft-drinks", "drink"]);

function buildPrompt(category: string): string {
  const isDrink = DRINK_CATEGORIES.has(category);

  const supportText: Record<string, string> = {
    pizza:       "matte black ceramic plate",
    pasta:       "matte black ceramic plate",
    dessert:     "matte black ceramic plate",
    cocktails:   "matte black round tray",
    beer:        "matte black round tray",
    coffee:      "matte black round tray",
    smoothies:   "matte black round tray",
    "soft-drinks": "matte black round tray",
    drink:       "matte black round tray",
    starter:     "matte black ceramic plate",
    panini:      "wooden rectangular cutting board with handle",
    salad:       "matte black ceramic plate",
    main:        "matte black ceramic plate",
    snack:       "matte black ceramic plate",
    breakfast:   "matte black ceramic plate",
    fusion:      "matte black ceramic plate",
    "daily-special": "matte black ceramic plate",
  };
  const support = supportText[category] ?? "matte black ceramic plate";
  const subjectWord = isDrink ? "beverage container" : "food item";

  return `TASK: photographic compositing — background replacement.

The input image shows a real ${subjectWord} that has been photographed by the restaurant. This subject represents the actual product served to customers and is IMMUTABLE.

OPERATION TO PERFORM:
- Preserve the original subject exactly as photographed
- Replace only the background environment
- Match lighting, shadow, and reflection to the new environment
- Maintain color consistency of the subject

STRICT PRESERVATION RULES (subject is immutable):
- Keep identical shape, proportions, colors, textures of the subject
- Keep identical ingredients, toppings, garnish, liquid, label, brand, packaging
- Keep identical framing and position of the subject in the frame
- Do not add, remove, or substitute any part of the subject
- Do not reinterpret what the subject is

BACKGROUND REPLACEMENT:
- New background: dark perforated metallic surface (matte black with regularly-spaced round holes, speaker grille pattern)
- Under the subject: ${support} (as a base surface)
- Lighting match: warm directional studio light from above-right, consistent with the new environment
- Shadow matching: soft natural shadows cast by the subject on the new surface, consistent with the light direction
- Reflection matching: subtle reflections on the supporting surface where physically appropriate
- Color consistency: preserve original subject colors, only adjust ambient tint slightly to blend

OUTPUT: 3:2 landscape composition, subject centered, sharp focus on subject, background clearly visible on all sides.

NEGATIVE (do NOT do):
- Do not generate a "luxury" or "gourmet" reinterpretation
- Do not add stylistic elements not present in the input
- Do not add any text, logo, watermark, or brand marking
- Do not add other food items or ingredients
- Do not "improve" or "beautify" the subject
- Do not treat this as creative regeneration — this is technical compositing only`;
}

async function loadBgTemplate(): Promise<Buffer | null> {
  try {
    const dir = path.join(process.cwd(), "public", "brand-references");
    const files = await readdir(dir);
    const tpl = files.find(f => /^bg-template\.(jpe?g|png|webp)$/i.test(f));
    if (!tpl) return null;
    return readFile(path.join(dir, tpl));
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, category, quality } = await req.json() as {
      imageBase64?: string;
      category?: string;
      quality?: "low" | "medium" | "high";
    };
    if (!imageBase64) return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });

    // Decodifica input dish
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z+]+;base64,/i, "");
    const dishBuf = Buffer.from(cleanBase64, "base64");

    // Carica bg-template come reference aggiuntiva (aiuta gpt-image a replicare lo stile)
    const bgBuf = await loadBgTemplate();

    // Costruisci form-data multipart
    const form = new FormData();
    form.append("model", MODEL);
    form.append("prompt", buildPrompt(category ?? "default"));
    form.append("size", "1536x1024");        // 3:2 landscape
    form.append("quality", quality ?? "medium");

    // image[] = array di reference; primo è il dish (priorità), poi bg-template
    form.append("image[]", new Blob([new Uint8Array(dishBuf)], { type: "image/png" }), "dish.png");
    if (bgBuf) {
      form.append("image[]", new Blob([new Uint8Array(bgBuf)], { type: "image/png" }), "bg-template.png");
    }

    console.log(`OpenAI ${MODEL} (quality=${quality ?? "medium"}, category=${category ?? "default"})`);

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenAI error:", res.status, errText);
      return NextResponse.json({ error: `OpenAI ${res.status}: ${errText.slice(0, 400)}` }, { status: 500 });
    }

    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 400));
      return NextResponse.json({ error: "No image returned from OpenAI" }, { status: 500 });
    }

    const dataUrl = `data:image/png;base64,${b64}`;
    return NextResponse.json({ imageDataUrl: dataUrl, mode: "openai-gpt-image-2", model: MODEL });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
