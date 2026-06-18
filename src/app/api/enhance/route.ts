import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const ENHANCE_PROMPT = `BACKGROUND COPY + DISH PLACE — two images input.

YOU RECEIVE 2 IMAGES:
1. IMAGE 1 = THE BRAND BACKGROUND TEMPLATE. It shows a DARK PERFORATED METAL SURFACE (matte black with regularly-spaced round holes/dots in a uniform grid pattern, like a speaker grille or audio panel). On top of it there is also some food and a wooden cutting board — IGNORE the food.
2. IMAGE 2 = THE DISH. Take only the food/dish from this image.

═══════════════════════════════════════════════════════════════════
THE OUTPUT MUST HAVE THESE NON-NEGOTIABLE VISUAL ELEMENTS:
═══════════════════════════════════════════════════════════════════

A) BACKGROUND: A LARGE DARK PERFORATED METAL SURFACE visible around the dish.
   - Color: MATTE BLACK / very dark charcoal.
   - Pattern: HUNDREDS of small round dots/perforations arranged in a regular grid (think: speaker grille, perforated steel sheet).
   - Visible on AT LEAST all 4 edges of the image, taking up AT LEAST 30% of the total image area.
   - This pattern is NOT optional — it MUST be clearly visible.

B) DISH PLACEMENT:
   - The dish from IMAGE 2 is placed at the CENTER, occupying AT MOST 60-65% of the image area.
   - Use a wooden cutting board under the dish if visually appropriate.
   - The dish must look EXACTLY like IMAGE 2 — same ingredients, same plating, same colors. Do not alter it.

C) LIGHTING: warm directional studio light from top-right (golden hour, 2800-3200K). Soft shadows lower-left of dish.

D) EMPTY BOTTOM AREA: leave the bottom-center 12% of the image as clean dark perforated surface (no dish, no garnish). This area will receive a logo in post-processing.

═══════════════════════════════════════════════════════════════════
ABSOLUTE FORBIDDEN:
═══════════════════════════════════════════════════════════════════
- Do NOT use a plain gray, white, beige, or smooth background. The perforated dark pattern is REQUIRED.
- Do NOT let the dish fill the whole frame. ALWAYS leave perforated background visible around the dish.
- Do NOT alter the dish from IMAGE 2 (no new ingredients, no different food).
- Do NOT include the food/dish from IMAGE 1 in the output.
- Do NOT add a logo yourself (we'll add it after).

Output: ONE photorealistic image, square 1:1, with the dish from IMAGE 2 placed centrally on a clearly visible DARK PERFORATED METAL background matching IMAGE 1.`;

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
