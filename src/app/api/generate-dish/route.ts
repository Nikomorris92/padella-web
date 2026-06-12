import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir, writeFile } from "fs/promises";
import path from "path";

export const maxDuration = 300;

const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function buildPrompt(dishName: string, ingredients: string): string {
  return `You are a team of: top food photographer + art director + graphic designer + UX designer.

OBJECTIVE
Generate ONE professional photograph of: "${dishName}".

ABSOLUTE STYLE STANDARD
The first 3 images you receive are the GOLDEN STANDARD reference photos. Study them very carefully and REPLICATE EXACTLY:
- background (same surface, same color, same texture);
- lighting (same direction, same warmth, same contrast);
- color temperature;
- saturation level;
- depth of field and bokeh on the background;
- shadows and reflections;
- composition framing;
- logo position (if present);
- logo size and opacity;
- chromatic filter;
- sharpness level.

The output MUST look like it came from the exact same photoshoot as the reference photos.

DISH SPECIFICATION — STRICT
Subject: ${dishName}
Visible ingredients ONLY: ${ingredients}

FORBIDDEN:
- DO NOT add ingredients not in the list above.
- DO NOT add cheese unless explicitly listed.
- DO NOT add meat unless explicitly listed.
- DO NOT add vegetables not in the list.
- DO NOT invent toppings.
- DO NOT create variants.
- DO NOT change the background style from the references.
- DO NOT change the lighting style from the references.
- DO NOT use a different filter than the references.

VERIFICATION BEFORE OUTPUT (mental check)
CHECK 1 — Does the dish in the image match exactly "${dishName}"? If not, fix.
CHECK 2 — Are the visible ingredients EXACTLY this list and nothing else? "${ingredients}". If not, fix.
CHECK 3 — Does the background match the references EXACTLY? If not, fix.
CHECK 4 — Does the lighting/color grading match the references EXACTLY? If not, fix.
CHECK 5 — Does it look like it was shot in the same session as the references? If not, fix.

EXPECTED OUTPUT
ONE photorealistic image of "${dishName}" that looks like part of the same photo series as the references. No text, no caption, no watermark unless visible in references.`;
}

async function loadReferenceImages(): Promise<Array<{ mimeType: string; data: string }>> {
  try {
    const dir = path.join(process.cwd(), "public", "brand-references");
    const files = await readdir(dir);
    const imgs = files.filter(f => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith(".")).sort();
    const out: Array<{ mimeType: string; data: string }> = [];
    for (const f of imgs.slice(0, 3)) {
      const buf = await readFile(path.join(dir, f));
      const ext = f.toLowerCase().split(".").pop();
      const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      out.push({ mimeType, data: buf.toString("base64") });
    }
    return out;
  } catch { return []; }
}

export async function POST(req: NextRequest) {
  try {
    const { dishName, ingredients, savePath } = await req.json();
    if (!dishName || !ingredients) return NextResponse.json({ error: "Missing dishName or ingredients" }, { status: 400 });

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GOOGLE_AI_API_KEY missing" }, { status: 500 });

    const references = await loadReferenceImages();
    if (references.length === 0) return NextResponse.json({ error: "No reference images in /public/brand-references" }, { status: 500 });

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: buildPrompt(dishName, ingredients) },
    ];
    for (const ref of references) parts.push({ inlineData: ref });

    const body = {
      contents: [{ role: "user", parts }],
      generationConfig: { responseModalities: ["IMAGE"] },
    };

    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Gemini ${res.status}: ${text}` }, { status: 500 });
    }

    const data = await res.json();
    const rspParts = data?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = rspParts.find((p: { inlineData?: { data?: string } }) => p.inlineData?.data);
    if (!imgPart) {
      console.error("No image:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json({ error: "No image generated", raw: data }, { status: 500 });
    }

    const outMime = imgPart.inlineData.mimeType || "image/jpeg";
    const imgBuf = Buffer.from(imgPart.inlineData.data, "base64");

    // Se savePath fornito, salva il file su disco
    if (savePath) {
      const cleanPath = savePath.startsWith("/") ? savePath.slice(1) : savePath;
      const abs = path.join(process.cwd(), "public", cleanPath);
      await writeFile(abs, imgBuf);
      return NextResponse.json({ ok: true, saved: savePath, references: references.length });
    }

    const dataUrl = `data:${outMime};base64,${imgPart.inlineData.data}`;
    return NextResponse.json({ ok: true, imageDataUrl: dataUrl, references: references.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
