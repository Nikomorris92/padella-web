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
    pizza:       "an elegant matte black premium round plate, slightly larger than the pizza",
    pasta:       "an elegant matte black premium ceramic bowl",
    dessert:     "an elegant matte black premium round plate",
    cocktails:   "a premium dark wooden coaster",
    beer:        "a premium dark wooden coaster",
    coffee:      "a premium dark wooden coaster",
    smoothies:   "a premium dark wooden coaster",
    "soft-drinks": "a premium dark wooden coaster",
    drink:       "a premium dark wooden coaster",
    starter:     "an elegant matte black premium oval plate",
    panini:      "a premium wooden cutting board",
    salad:       "an elegant matte black premium bowl",
    main:        "an elegant matte black premium ceramic plate",
    snack:       "an elegant matte black premium plate",
    breakfast:   "an elegant matte black premium plate",
    fusion:      "an elegant matte black premium plate",
    "daily-special": "an elegant matte black premium plate",
  };
  const support = supportText[category] ?? "an elegant matte black premium plate";
  const subjectWord = isDrink ? "beverage/container" : "dish";

  return `Re-photograph the EXACT SUBJECT from the input image for a luxury menu (Padella Bangkok).

═══ CRITICAL RULE — READ FIRST ═══
The input image contains a subject (food, drink, bottle, can, glass, cup, or whatever it is). You MUST reproduce THAT EXACT SUBJECT — pixel-for-pixel accurate: same shape, same colors, same brand/label, same liquid, same ingredients, same toppings, same everything.
DO NOT substitute the subject with something else. DO NOT reinterpret. DO NOT "improve" or "correct" it. If the input is a soda can, the output MUST be that same soda can (same brand, same label, same color). If the input is a pizza, output that same pizza. If it is a bottle of water, output that same bottle. NEVER replace the subject with a different item.
If you are unsure what the subject is, keep it as literally shown — do not guess a menu item.
══════════════════════════════════

Now apply this treatment AROUND the preserved subject:

1. Place the ${subjectWord} on ${support}. The subject must sit fully inside the support — no cropping.
2. Background: dark perforated metallic (matte black with regularly-spaced round holes, like a speaker grille), clearly visible on all 4 sides.
3. Add the "PADELLA - bites and vibes -" logo centered at the bottom (cream text in a thin rectangular box, small padel racket icon left of "PADELLA", tiny Italian flag bar bottom-right of the box).
4. Lighting: warm directional studio light from above-right, soft natural shadows, golden hour color temperature. Professional photography style.
5. Composition: 3:2 landscape, subject centered, occupies ~55-65% of width, plenty of perforated background around it.
6. Sharp focus on the subject, slight bokeh on background edges. Magazine-quality look.

ABSOLUTE: preserve the subject identity 1:1. Do not crop. Do not add other items. Do not change the subject.`;
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
