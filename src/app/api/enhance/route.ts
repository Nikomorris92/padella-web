import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const ENHANCE_PROMPT = `EDIT THIS IMAGE — single image input.

YOU RECEIVE EXACTLY ONE IMAGE: a photo of a dish. Edit ONLY this image.

KEEP UNCHANGED:
- The dish itself: every ingredient, every garnish, every shape, every color of the food. The dish must look exactly the same.
- The exact same food. Do NOT swap, replace, or transform the dish into anything else.

CHANGE ONLY THE STYLE around the dish:
- Background: replace with a dark, slightly textured surface (deep matte black or very dark green-black). Style: professional restaurant table photography. Subtle perforated or grid-like pattern visible in soft focus.
- Lighting: warm directional studio light from top-right, creating soft shadows on the lower-left of the dish. Golden-hour warmth (2800-3200K color temperature). The dish should be the brightest area of the image.
- Color grading: rich saturated warm tones, deep blacks, no clipped highlights, slight teal in shadows. Premium food photography color palette.
- Depth of field: dish in sharp focus, background softly blurred (f/2.8 look).
- Composition: dish centered, slightly elevated angle (about 45° overhead), professional framing.
- Polish: increase sharpness on the dish, add subtle vignette to focus eye on the food.

DO NOT add any logo, watermark, or text. The logo will be added separately in a post-processing step.
Leave clean empty space at the bottom-center of the image (about 12% of the height) — slightly darker, no garnish elements there.

ABSOLUTE RULES:
- Output the SAME dish from the input image. Do NOT generate any other food.
- Do NOT add ingredients (no meat, no vegetables, no garnishes that weren't in the original).
- Do NOT remove ingredients.
- Do NOT replace the dish with a different one.

Output: ONE photorealistic image of THE SAME DISH from the input, re-styled with the background and lighting described above.`;

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

    // SOLO la foto del piatto (NIENTE reference, evita che il modello sputi le ref).
    // Lo stile è descritto solo nel prompt testuale.
    console.log("Nano Banana: 1 target image, style described in prompt only");
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: ENHANCE_PROMPT },
      { inlineData: { mimeType, data: cleanBase64 } },
    ];

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
