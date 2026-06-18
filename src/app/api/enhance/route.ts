import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { padellaLogoSvg } from "@/lib/padellaLogo";

export const maxDuration = 90;

const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// ═══════════════════════════════════════════════════════════════
// STEP 1: AI estrae SOLO il piatto isolato (sfondo chroma key verde)
// ═══════════════════════════════════════════════════════════════
const EXTRACT_PROMPT = `ISOLATE THE DISH on a chroma-key background.

You receive ONE image of a food dish. Re-render it as follows:
- Keep the dish itself IDENTICAL: same ingredients, same plating, same shape, same colors, same texture.
- Place the dish at the CENTER of the output.
- Replace EVERYTHING ELSE (background, surface, plate, hands, surroundings) with a UNIFORM SOLID BRIGHT MAGENTA color (RGB 255,0,255 — pure magenta #FF00FF). The magenta MUST be perfectly flat and uniform — no shadows, no gradients, no texture on the background.
- The dish itself should NOT have any magenta on it.
- Slightly improve the dish: warm appetizing lighting on it, sharpen details, professional food-photo color.
- Square 1:1 aspect ratio output.

DO NOT include any text, logo, watermark, plate, or table — only the dish + magenta background.
DO NOT change the dish identity (no new ingredients, no removal of ingredients).

Output: ONE photorealistic image, dish at center, surrounded by pure magenta #FF00FF.`;

async function loadBackground(): Promise<Buffer> {
  const dir = path.join(process.cwd(), "public", "brand-references");
  const files = await readdir(dir).catch(() => []);
  const tpl = files.find(f => /^bg-template\.(jpe?g|png|webp)$/i.test(f));
  const refs = files.filter(f => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith(".") && !f.startsWith("bg-template")).sort();
  const target = tpl ?? refs[0];
  if (!target) throw new Error("No background reference found in /public/brand-references");
  return readFile(path.join(dir, target));
}

/** Genera un pattern perforated nero (sfondo scuro + cerchietti grigi)
 *  100% via SVG: nessun problema di colore/tinta. */
async function buildPerforatedCanvas(_refBuf: Buffer, targetW: number, targetH: number): Promise<Buffer> {
  // Pattern: cerchi distintivi su sfondo nero (matcha lo speaker-grille delle reference)
  const dotSpacing = 32;
  const dotRadius = 5.2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${targetW}" height="${targetH}">
    <defs>
      <pattern id="perf" x="0" y="0" width="${dotSpacing}" height="${dotSpacing}" patternUnits="userSpaceOnUse">
        <rect width="${dotSpacing}" height="${dotSpacing}" fill="#0d0d0d"/>
        <circle cx="${dotSpacing/2}" cy="${dotSpacing/2}" r="${dotRadius}" fill="#1f1f1f"/>
        <circle cx="${dotSpacing/2}" cy="${dotSpacing/2 - 0.6}" r="${dotRadius - 1}" fill="#040404"/>
      </pattern>
      <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="70%" stop-color="#000000" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.75"/>
      </radialGradient>
    </defs>
    <rect width="${targetW}" height="${targetH}" fill="url(#perf)"/>
    <rect width="${targetW}" height="${targetH}" fill="url(#vignette)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Rimuove i pixel magenta dal piatto AI e produce PNG con alpha.
 *  Soglia aggressiva + correzione colore dei bordi (de-fringe). */
async function chromaKeyMagenta(input: Buffer): Promise<Buffer> {
  const img = sharp(input).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  const channels = info.channels;

  for (let i = 0; i < out.length; i += channels) {
    const r = out[i], g = out[i + 1], b = out[i + 2];
    // Magenta = R alto + B alto + G mediamente più basso degli altri due
    const avgRB = (r + b) / 2;
    const greenGap = avgRB - g;

    if (greenGap > 60 && avgRB > 130) {
      // Pixel decisamente magenta → trasparente
      out[i + 3] = 0;
    } else if (greenGap > 25 && avgRB > 110) {
      // Bordi: alpha sfumato + correggi tinta
      const ratio = (greenGap - 25) / 35;
      out[i + 3] = Math.round(255 * (1 - Math.min(1, ratio)));
      // De-fringe: porta R e B verso G per togliere tinta magenta residua
      out[i] = Math.round(r - (r - g) * ratio * 0.7);
      out[i + 2] = Math.round(b - (b - g) * ratio * 0.7);
    }
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels } })
    .png()
    .toBuffer();
}

/** Costruisce sfondo perforato pulito + tagliere ovale di legno al centro.
 *  Niente cibo della reference, niente vecchio logo. */
async function buildCleanBackground(refBuf: Buffer): Promise<Buffer> {
  const meta = await sharp(refBuf).metadata();
  const W = meta.width!;
  const H = meta.height!;

  // 1. Canvas perforated pulito (tile dal patch dell'angolo)
  const perforated = await buildPerforatedCanvas(refBuf, W, H);

  // 2. Tagliere ovale di legno al centro
  const cx = W / 2;
  const cy = H * 0.48;
  const rx = Math.round(W * 0.36);
  const ry = Math.round(H * 0.42);
  const taglierSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="wood" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#D9B583"/>
        <stop offset="60%" stop-color="#C49968"/>
        <stop offset="100%" stop-color="#8A6840"/>
      </radialGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="14"/>
        <feOffset dx="0" dy="18" result="off"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.55"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#wood)" filter="url(#shadow)"/>
    <!-- Venature legno -->
    <g opacity="0.18" stroke="#5C3A1E" stroke-width="0.8" fill="none">
      <path d="M ${cx-rx*0.7} ${cy-ry*0.3} Q ${cx} ${cy-ry*0.2} ${cx+rx*0.7} ${cy-ry*0.4}"/>
      <path d="M ${cx-rx*0.6} ${cy} Q ${cx} ${cy+ry*0.1} ${cx+rx*0.6} ${cy-ry*0.05}"/>
      <path d="M ${cx-rx*0.5} ${cy+ry*0.3} Q ${cx} ${cy+ry*0.35} ${cx+rx*0.5} ${cy+ry*0.25}"/>
    </g>
  </svg>`;

  return sharp(perforated)
    .composite([{ input: Buffer.from(taglierSvg), blend: "over" }])
    .jpeg({ quality: 95 })
    .toBuffer();
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GOOGLE_AI_API_KEY missing" }, { status: 500 });

    // Estrai mime + base64 puro
    const mimeMatch = (imageBase64 as string).match(/^data:(image\/[a-z+]+);base64,/i);
    const mimeType = mimeMatch ? mimeMatch[1].toLowerCase() : "image/jpeg";
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z+]+;base64,/i, "");

    // ─── STEP 1: AI isola il piatto su magenta ───
    console.log("Step 1/3: AI isola dish on magenta");
    const aiRes = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [
          { text: EXTRACT_PROMPT },
          { inlineData: { mimeType, data: cleanBase64 } },
        ] }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      return NextResponse.json({ error: `Gemini ${aiRes.status}: ${t.slice(0,200)}` }, { status: 500 });
    }
    const aiData = await aiRes.json();
    const parts = aiData?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find((p: { inlineData?: { data?: string } }) => p.inlineData?.data);
    if (!imgPart) return NextResponse.json({ error: "AI did not return image" }, { status: 500 });
    const aiBuf = Buffer.from(imgPart.inlineData.data, "base64");

    // ─── STEP 2: chroma key → piatto trasparente PNG ───
    console.log("Step 2/3: chroma key magenta → transparent");
    const dishPng = await chromaKeyMagenta(aiBuf);

    // ─── STEP 3: compose deterministicamente ───
    console.log("Step 3/3: composite onto fixed background + logo");
    const bgRaw = await loadBackground();
    const bgBuf = await buildCleanBackground(bgRaw); // copre la steak della reference
    const bgMeta = await sharp(bgBuf).metadata();
    const W = bgMeta.width!;
    const H = bgMeta.height!;

    // Resize piatto: occupa ~62% larghezza, max 75% altezza
    const dishMaxW = Math.round(W * 0.62);
    const dishMaxH = Math.round(H * 0.72);
    const dishResized = await sharp(dishPng)
      .resize({ width: dishMaxW, height: dishMaxH, fit: "inside", withoutEnlargement: false })
      .toBuffer();
    const dishMeta = await sharp(dishResized).metadata();
    const dishW = dishMeta.width!;
    const dishH = dishMeta.height!;
    const dishLeft = Math.round((W - dishW) / 2);
    const dishTop = Math.round((H - dishH) / 2) - Math.round(H * 0.04); // leggermente sopra centro

    // Logo SVG → PNG, posizionato in basso al centro
    const logoW = Math.round(W * 0.28);
    const logoPng = await sharp(Buffer.from(padellaLogoSvg(logoW))).png().toBuffer();
    const logoMeta = await sharp(logoPng).metadata();
    const logoH = logoMeta.height!;
    const logoLeft = Math.round((W - logoW) / 2);
    const logoTop = H - logoH - Math.round(H * 0.02); // 2% padding dal fondo

    const finalBuf = await sharp(bgBuf)
      .composite([
        { input: dishResized, top: dishTop, left: dishLeft },
        { input: logoPng, top: logoTop, left: logoLeft },
      ])
      .jpeg({ quality: 92 })
      .toBuffer();

    const dataUrl = `data:image/jpeg;base64,${finalBuf.toString("base64")}`;
    return NextResponse.json({ imageDataUrl: dataUrl, mode: "deterministic-pipeline" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
