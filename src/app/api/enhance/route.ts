import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const ENHANCE_PROMPT = `BACKGROUND SWAP TASK — two images input.

YOU RECEIVE 2 IMAGES IN ORDER:
1. IMAGE 1 = THE BRAND TEMPLATE. Use ONLY its dark perforated background, lighting style, color grading, composition. IGNORE the food/object that is on it.
2. IMAGE 2 = THE DISH SOURCE. Take ONLY the food/dish from this image.

YOUR TASK:
- Produce a NEW image where the food from IMAGE 2 sits on the EXACT SAME dark perforated background of IMAGE 1.
- The background MUST be pixel-similar to IMAGE 1: same dark color, same perforated/dotted texture, same lighting direction (top-right warm light), same vignette, same matte black tones.
- Keep IMAGE 2's food perfectly intact: same ingredients, same plating, same shape, same colors. Do NOT swap or alter the dish in any way.

CRITICAL RULES:
- The food output MUST be the dish from IMAGE 2 — NEVER use the food/object from IMAGE 1.
- The background output MUST match IMAGE 1's dark perforated surface — do not invent a new background.
- Center the dish in the frame, slightly elevated camera angle (45° overhead).
- Same warm lighting from top-right as IMAGE 1.
- Sharp focus on dish, slight blur on background edges (depth of field).
- Leave clean empty space at the bottom-center of the image (about 12% of the height) for a logo — do not add any logo yourself.

ABSOLUTE FORBIDDEN:
- Do NOT add ingredients that are not in IMAGE 2.
- Do NOT show the food from IMAGE 1 in any way (no meat, no potatoes, no plate from image 1).
- Do NOT generate a different dish.

Output: ONE photorealistic image — the dish from IMAGE 2 on the background of IMAGE 1, in the same brand photographic style.`;

/** Carica tutte le foto di riferimento da public/brand-references/ */
async function loadReferenceImages(): Promise<Array<{ mimeType: string; data: string }>> {
  try {
    const dir = path.join(process.cwd(), "public", "brand-references");
    const files = await readdir(dir);
    const imgs = files.filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort();
    const out: Array<{ mimeType: string; data: string }> = [];
    for (const f of imgs.slice(0, 3)) { // max 3 reference
      const buf = await readFile(path.join(dir, f));
      const ext = f.toLowerCase().split(".").pop();
      const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      out.push({ mimeType, data: buf.toString("base64") });
    }
    return out;
  } catch (e) {
    console.warn("Nessuna reference trovata in public/brand-references:", e);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GOOGLE_AI_API_KEY missing in .env.local" }, { status: 500 });

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Carica UNA SOLA reference come "template di sfondo" + il piatto utente.
    // Il prompt è esplicito su quale è quale e cosa estrarre da ciascuna.
    const references = await loadReferenceImages();
    const bgTemplate = references[0]; // prima reference = template sfondo
    console.log(`Nano Banana: bg-template + 1 dish target (refs avail: ${references.length})`);
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: ENHANCE_PROMPT },
    ];
    if (bgTemplate) parts.push({ inlineData: bgTemplate });
    parts.push({ inlineData: { mimeType, data: cleanBase64 } });

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
      console.error("Gemini error:", res.status, text);
      return NextResponse.json({ error: `Gemini ${res.status}: ${text}` }, { status: 500 });
    }

    const data = await res.json();
    const rspParts = data?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = rspParts.find((p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data);
    if (!imgPart) {
      console.error("No image in Gemini response:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json({ error: "Nessuna immagine generata", raw: data }, { status: 500 });
    }

    const aiBuf: Buffer = Buffer.from(imgPart.inlineData.data, "base64");

    // POST-PROCESSING: estrae la striscia logo dalla reference e la sovrappone
    // con blend mode "lighten" (mostra solo le parti chiare = il logo).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let finalBuf: any = aiBuf;
    try {
      const refDir = path.join(process.cwd(), "public", "brand-references");
      const refs = (await readdir(refDir)).filter(f => /\.(jpe?g|png)$/i.test(f) && !f.startsWith(".")).sort();
      if (refs.length > 0) {
        // Usa l'ULTIMA reference (più clean per logo: sfondo dark uniforme, no tagliere)
        const logoSource = refs[refs.length - 1];
        const refBuf = await readFile(path.join(refDir, logoSource));
        const refMeta = await sharp(refBuf).metadata();
        const refW = refMeta.width!;
        const refH = refMeta.height!;
        // Zona logo: 32% larghezza × 13% altezza nel bottom della reference
        const logoW = Math.round(refW * 0.32);
        const logoH = Math.round(refH * 0.13);
        const logoX = Math.round((refW - logoW) / 2);
        const logoY = refH - logoH - Math.round(refH * 0.005);
        // Estrai + boost contrasto + threshold: solo pixel luminosi sopravvivono
        const logoCrop = await sharp(refBuf)
          .extract({ left: logoX, top: logoY, width: logoW, height: logoH })
          .modulate({ brightness: 1.15 })
          .linear(1.6, -80) // contrasto: scuri → neri, chiari → bianchi
          .toBuffer();

        const aiMeta = await sharp(aiBuf).metadata();
        const outW = aiMeta.width!;
        const outH = aiMeta.height!;
        const overlayW = Math.round(outW * 0.28);
        const overlayH = Math.round(outH * 0.13);
        const overlayResized = await sharp(logoCrop)
          .resize({ width: overlayW, height: overlayH, fit: "contain", background: { r:0,g:0,b:0,alpha:0 } })
          .toBuffer();

        const overlayX = Math.round((outW - overlayW) / 2);
        const overlayY = outH - overlayH - Math.round(outH * 0.015);
        finalBuf = await sharp(aiBuf)
          .composite([{ input: overlayResized, top: overlayY, left: overlayX, blend: "screen" }])
          .jpeg({ quality: 90 })
          .toBuffer();
      }
    } catch (e) {
      console.warn("Compositing logo fallito (uso output AI senza logo):", e);
    }

    const dataUrl = `data:image/jpeg;base64,${finalBuf.toString("base64")}`;
    return NextResponse.json({ imageDataUrl: dataUrl, mode: "single-image-edit+logo-overlay" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
