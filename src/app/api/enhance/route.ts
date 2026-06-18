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

    // Costruisce template: perforated + piatto-con-supporto + logo
    // NESSUN tagliere inventato: piatto + supporto vengono dalla foto utente.
    const perforated = await buildPerforatedCanvas(W, H);

    const dishMaxW = Math.round(W * 0.75);
    const dishMaxH = Math.round(H * 0.78);
    const dishResized = await sharp(dishFiltered)
      .resize({ width: dishMaxW, height: dishMaxH, fit: "inside" })
      .toBuffer();
    const dishMeta = await sharp(dishResized).metadata();
    const dishW = dishMeta.width!;
    const dishH = dishMeta.height!;
    const dishLeft = Math.round((W - dishW) / 2);
    const dishTop = Math.round((H - dishH) / 2) - Math.round(H * 0.04);

    const logoW = Math.round(W * 0.32);
    const logoPng = await sharp(Buffer.from(padellaLogoSvg(logoW))).png().toBuffer();
    const logoMeta = await sharp(logoPng).metadata();
    const logoH = logoMeta.height!;
    const logoLeft = Math.round((W - logoW) / 2);
    const logoTop = H - logoH - Math.round(H * 0.025);

    const finalBuf = await sharp(perforated)
      .composite([
        { input: dishResized, top: dishTop, left: dishLeft },
        { input: logoPng, top: logoTop, left: logoLeft },
      ])
      .jpeg({ quality: 92 })
      .toBuffer();

    const dataUrl = `data:image/jpeg;base64,${finalBuf.toString("base64")}`;
    return NextResponse.json({ imageDataUrl: dataUrl, mode: "client-bg-removal+server-composite" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
