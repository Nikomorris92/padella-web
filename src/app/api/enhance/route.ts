import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { removeBackground } from "@imgly/background-removal-node";
import { padellaLogoSvg } from "@/lib/padellaLogo";

export const maxDuration = 120;
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

/** Pattern perforated SVG identico ogni volta (no AI). */
async function buildPerforatedCanvas(W: number, H: number): Promise<Buffer> {
  const dotSpacing = 32;
  const dotRadius = 5.2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
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
    <rect width="${W}" height="${H}" fill="url(#perf)"/>
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Tagliere ovale di legno generato via SVG. */
function woodTaglierSvg(W: number, H: number): string {
  const cx = W / 2;
  const cy = H * 0.48;
  const rx = Math.round(W * 0.36);
  const ry = Math.round(H * 0.42);
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
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
    <g opacity="0.18" stroke="#5C3A1E" stroke-width="0.8" fill="none">
      <path d="M ${cx-rx*0.7} ${cy-ry*0.3} Q ${cx} ${cy-ry*0.2} ${cx+rx*0.7} ${cy-ry*0.4}"/>
      <path d="M ${cx-rx*0.6} ${cy} Q ${cx} ${cy+ry*0.1} ${cx+rx*0.6} ${cy-ry*0.05}"/>
      <path d="M ${cx-rx*0.5} ${cy+ry*0.3} Q ${cx} ${cy+ry*0.35} ${cx+rx*0.5} ${cy+ry*0.25}"/>
    </g>
  </svg>`;
}

/** Applica filtro brand WARM PADELLA al piatto (preservando i pixel originali). */
async function applyBrandFilter(dishBuf: Buffer): Promise<Buffer> {
  return sharp(dishBuf)
    .modulate({
      brightness: 1.04,    // leggero boost luminosità
      saturation: 1.12,    // colori più vivi
      hue: 6,              // shift verso warm
    })
    .linear(1.08, -8)      // contrasto leggermente alzato
    .sharpen({ sigma: 0.6, m1: 0.4, m2: 0.3 })  // nitidezza
    .png()
    .toBuffer();
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });

    // 1. Decodifica input in Buffer + normalizza in JPEG/PNG vero (alcuni dataURL hanno bytes errati)
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z+]+;base64,/i, "");
    const inputBuf = Buffer.from(cleanBase64, "base64");
    // Riencodifica via sharp per garantire formato pulito
    const normalizedJpeg = await sharp(inputBuf).jpeg({ quality: 95 }).toBuffer();

    // ─── STEP 1: rimuovi sfondo dalla foto originale (NO AI redraw) ───
    console.log("Step 1/3: removeBackground sui PIXEL ORIGINALI");
    const blob = new Blob([new Uint8Array(normalizedJpeg)], { type: "image/jpeg" });
    const dishBlob = await removeBackground(blob, {
      output: { format: "image/png", quality: 0.95 },
    });
    const dishOriginalBuf = Buffer.from(await dishBlob.arrayBuffer());

    // ─── STEP 2: applica filtro brand sui pixel originali ───
    console.log("Step 2/3: applico filtro brand warm");
    const dishFiltered = await applyBrandFilter(dishOriginalBuf);

    // ─── STEP 3: compositing deterministico ───
    console.log("Step 3/3: composito su template brand");

    // Dimensioni target = stessa proporzione della reference
    const refBuf = await loadBackgroundReference();
    const refMeta = await sharp(refBuf).metadata();
    const W = refMeta.width!;
    const H = refMeta.height!;

    const perforated = await buildPerforatedCanvas(W, H);
    const tagliere = Buffer.from(woodTaglierSvg(W, H));

    // Resize del piatto: occupa ~62% larghezza
    const dishMaxW = Math.round(W * 0.62);
    const dishMaxH = Math.round(H * 0.72);
    const dishResized = await sharp(dishFiltered)
      .resize({ width: dishMaxW, height: dishMaxH, fit: "inside" })
      .toBuffer();
    const dishMeta = await sharp(dishResized).metadata();
    const dishW = dishMeta.width!;
    const dishH = dishMeta.height!;
    const dishLeft = Math.round((W - dishW) / 2);
    const dishTop = Math.round((H - dishH) / 2) - Math.round(H * 0.04);

    // Logo PADELLA in basso
    const logoW = Math.round(W * 0.28);
    const logoPng = await sharp(Buffer.from(padellaLogoSvg(logoW))).png().toBuffer();
    const logoMeta = await sharp(logoPng).metadata();
    const logoH = logoMeta.height!;
    const logoLeft = Math.round((W - logoW) / 2);
    const logoTop = H - logoH - Math.round(H * 0.02);

    const finalBuf = await sharp(perforated)
      .composite([
        { input: tagliere },
        { input: dishResized, top: dishTop, left: dishLeft },
        { input: logoPng, top: logoTop, left: logoLeft },
      ])
      .jpeg({ quality: 92 })
      .toBuffer();

    const dataUrl = `data:image/jpeg;base64,${finalBuf.toString("base64")}`;
    return NextResponse.json({ imageDataUrl: dataUrl, mode: "true-bg-removal-no-ai-redraw" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
