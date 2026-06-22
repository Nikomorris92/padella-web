import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import path from "path";

export const maxDuration = 120;
export const runtime = "nodejs";

const MODEL = "gpt-image-2";
const ENDPOINT = "https://api.openai.com/v1/images/edits";

function buildPrompt(category: string): string {
  const supportText: Record<string, string> = {
    pizza:   "an elegant matte black premium round plate, slightly larger than the pizza",
    pasta:   "an elegant matte black premium ceramic bowl",
    dessert: "an elegant matte black premium round plate",
    drink:   "a premium dark wooden coaster under the glass",
    starter: "an elegant matte black premium oval plate",
    panini:  "a premium wooden cutting board",
    salad:   "an elegant matte black premium bowl",
    main:    "an elegant matte black premium ceramic plate",
  };
  const support = supportText[category] ?? "an elegant matte black premium plate";

  return `Re-photograph this dish for a luxury Italian restaurant menu (Padella Bangkok).

REQUIREMENTS — strict:

1. Keep the food EXACTLY as in the input image: same ingredients, same shape, same colors, same toppings. Do NOT change, add, or remove anything from the food itself.

2. Replace the underlying surface with ${support}. The dish must sit fully inside the support — no part of the food is cropped.

3. Place this plate/bowl/board on a dark perforated metallic background (matte black with regularly-spaced round holes, like a speaker grille). The perforated background must be clearly visible around the plate on all 4 sides.

4. Add the "PADELLA - bites and vibes -" logo centered at the bottom of the image (cream/off-white text inside a thin rectangular box, with a small padel racket icon to the left of the word PADELLA, and a tiny Italian flag bar at the bottom-right of the box).

5. Lighting: warm directional studio light from above-right, soft natural shadows below the plate, golden hour color temperature. Professional food photography style.

6. Composition: 4:3 landscape, dish centered, plate occupies ~55-65% of width, plenty of dark perforated background visible around it.

7. Sharp focus on the dish, slight bokeh on background edges. Premium magazine-quality look.

ABSOLUTE: do not crop the food. Do not add other dishes. Do not change ingredients.`;
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
