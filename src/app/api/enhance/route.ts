import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { padellaLogoSvg } from "@/lib/padellaLogo";

export const maxDuration = 30;
export const runtime = "nodejs";

async function loadBackgroundReference(): Promise<Buffer> {
  const dir = path.join(process.cwd(), "public", "brand-references");
  const files = await readdir(dir).catch(() => []);
  const tpl = files.find(f => /^bg-template\.(jpe?g|png|webp)$/i.test(f));
  const refs = files.filter(f => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith(".") && !f.startsWith("bg-template")).sort();
  const target = tpl ?? refs[0];
  if (!target) throw new Error("No reference in /public/brand-references");
  return readFile(path.join(dir, target));
}

async function buildPerforatedCanvas(W: number, H: number): Promise<Buffer> {
  // Pattern fedele alle reference: cerchi piccoli scuri profondi su metal grigio
  const dotSpacing = 28;
  const dotRadius = 4.2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <!-- Sfondo metallico leggermente texturizzato -->
      <radialGradient id="metalBg" cx="50%" cy="40%" r="80%">
        <stop offset="0%" stop-color="#1c1c1c"/>
        <stop offset="60%" stop-color="#0e0e0e"/>
        <stop offset="100%" stop-color="#020202"/>
      </radialGradient>
      <!-- Singolo foro: con shadow interna per profondità -->
      <radialGradient id="hole" cx="50%" cy="35%" r="55%">
        <stop offset="0%" stop-color="#1a1a1a"/>
        <stop offset="50%" stop-color="#000000"/>
        <stop offset="100%" stop-color="#000000"/>
      </radialGradient>
      <pattern id="perf" x="0" y="0" width="${dotSpacing}" height="${dotSpacing}" patternUnits="userSpaceOnUse">
        <!-- Cerchio esterno leggero (bordo del foro) -->
        <circle cx="${dotSpacing/2}" cy="${dotSpacing/2}" r="${dotRadius + 0.6}" fill="#2a2a2a" opacity="0.7"/>
        <!-- Foro nero profondo -->
        <circle cx="${dotSpacing/2}" cy="${dotSpacing/2}" r="${dotRadius}" fill="url(#hole)"/>
        <!-- Riflesso minimo in alto -->
        <ellipse cx="${dotSpacing/2 - 0.5}" cy="${dotSpacing/2 - dotRadius*0.5}" rx="${dotRadius*0.3}" ry="${dotRadius*0.18}" fill="#3a3a3a" opacity="0.4"/>
      </pattern>
      <!-- Vignette ai bordi -->
      <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="70%" stop-color="#000000" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.80"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#metalBg)"/>
    <rect width="${W}" height="${H}" fill="url(#perf)"/>
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Filtro brand warm applicato ai PIXEL ORIGINALI del piatto. */
async function applyBrandFilter(dishBuf: Buffer): Promise<Buffer> {
  return sharp(dishBuf)
    .modulate({ brightness: 1.04, saturation: 1.12, hue: 6 })
    .linear(1.08, -8)
    .sharpen({ sigma: 0.6, m1: 0.4, m2: 0.3 })
    .png()
    .toBuffer();
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });

    // Il client ha già fatto background removal → riceve PNG con alpha trasparente
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z+]+;base64,/i, "");
    const dishBuf = Buffer.from(cleanBase64, "base64");

    // Applica filtro brand (preservando pixel originali)
    console.log("Sharp: applico filtro brand + compositing");
    const dishFiltered = await applyBrandFilter(dishBuf);

    // Carica reference per dimensioni
    const refBuf = await loadBackgroundReference();
    const refMeta = await sharp(refBuf).metadata();
    const W = refMeta.width!;
    const H = refMeta.height!;

    // Carica bg-template.* (sfondo+logo già puliti, generati esternamente).
    // Fallback: SVG perforato sintetico se manca il template.
    const dir = path.join(process.cwd(), "public", "brand-references");
    const files = await readdir(dir).catch(() => []);
    const tplName = files.find(f => /^bg-template\.(jpe?g|png|webp)$/i.test(f));
    const baseCanvas = tplName
      ? await readFile(path.join(dir, tplName))
      : await buildPerforatedCanvas(W, H);

    // Piatto al centro MOLTO grande (~+8cm visivi). Posizione alta per evitare il logo.
    const dishMaxW = Math.round(W * 0.95);
    const dishMaxH = Math.round(H * 0.85);
    const dishResized = await sharp(dishFiltered)
      .resize({ width: dishMaxW, height: dishMaxH, fit: "inside" })
      .toBuffer();
    const dishMeta = await sharp(dishResized).metadata();
    const dishW = dishMeta.width!;
    const dishH = dishMeta.height!;
    const dishLeft = Math.round((W - dishW) / 2);
    // Spinto su per non coprire il logo (che è in fondo)
    const dishTop = Math.round((H - dishH) / 2) - Math.round(H * 0.04);

    // Quando uso bg-template REALE, il logo del template è già nell'immagine: niente SVG logo.
    const composites: Array<{ input: Buffer; top: number; left: number }> = [
      { input: dishResized, top: dishTop, left: dishLeft },
    ];
    if (!tplName) {
      const logoW = Math.round(W * 0.30);
      const logoPng = await sharp(Buffer.from(padellaLogoSvg(logoW))).png().toBuffer();
      const logoMeta = await sharp(logoPng).metadata();
      const logoH = logoMeta.height!;
      composites.push({
        input: logoPng,
        top: H - logoH - Math.round(H * 0.025),
        left: Math.round((W - logoW) / 2),
      });
    }

    const finalBuf = await sharp(baseCanvas)
      .composite(composites)
      .jpeg({ quality: 92 })
      .toBuffer();

    const dataUrl = `data:image/jpeg;base64,${finalBuf.toString("base64")}`;
    return NextResponse.json({ imageDataUrl: dataUrl, mode: "client-bg-removal+server-composite" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
