import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { padellaLogoSvg } from "@/lib/padellaLogo";
import { generateSupportSvg, categoryToSupport, type SupportCategory } from "@/lib/premiumSupports";

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
    const body = await req.json() as { imageBase64?: string; category?: string };
    const { imageBase64, category: requestedCategory } = body;
    if (!imageBase64) return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });

    // Il client ha già fatto background removal → riceve PNG con alpha trasparente
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z+]+;base64,/i, "");
    const dishBuf = Buffer.from(cleanBase64, "base64");

    // Applica filtro brand (preservando pixel originali)
    console.log("Sharp: applico filtro brand + compositing");
    const dishFiltered = await applyBrandFilter(dishBuf);

    // Determina la categoria → quale supporto premium usare sotto al cibo
    const supportCat: SupportCategory = categoryToSupport(requestedCategory ?? "default");
    console.log(`Premium support: ${supportCat}`);

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

    // ═══════════════════════════════════════════════════════════════════
    // REGOLA: sfondo si adatta al soggetto, mai viceversa.
    // - NO TRIM aggressivo: preservo TUTTO compresi ombre/bordi soft del bg-removal
    // - fit: "inside" sempre, MAI crop
    // - Margini di sicurezza: 10% laterali, 12% top, 18% bottom (per logo template)
    // - Se il soggetto è più piccolo dell'area sicura → resta più piccolo (no enlarge)
    // ═══════════════════════════════════════════════════════════════════
    const SAFE_MARGIN_X = 0.10;        // 10% laterale
    const SAFE_MARGIN_TOP = 0.06;      // 6% top
    const SAFE_MARGIN_BOTTOM = 0.18;   // 18% bottom (riservato logo template)
    const safeAreaW = Math.round(W * (1 - SAFE_MARGIN_X * 2));
    const safeAreaH = Math.round(H * (1 - SAFE_MARGIN_TOP - SAFE_MARGIN_BOTTOM));

    // Resize SOLO se necessario: se l'immagine è già più piccola dell'area, NON ingrandisco.
    // withoutEnlargement: true garantisce che il soggetto resta piccolo se piccolo (regola brand).
    const dishResized = await sharp(dishFiltered)
      .resize({
        width: safeAreaW,
        height: safeAreaH,
        fit: "inside",
        withoutEnlargement: false, // permettiamo enlarge fino all'area sicura, mai oltre
      })
      .toBuffer();

    const dishMeta = await sharp(dishResized).metadata();
    const dishW = dishMeta.width!;
    const dishH = dishMeta.height!;

    // Centro orizzontalmente, posiziono verticalmente nell'area sicura
    const dishLeft = Math.round((W - dishW) / 2);
    const safeTopStart = Math.round(H * SAFE_MARGIN_TOP);
    const safeBottomEnd = Math.round(H * (1 - SAFE_MARGIN_BOTTOM));
    const safeCenterY = (safeTopStart + safeBottomEnd) / 2;
    const dishTop = Math.round(safeCenterY - dishH / 2);

    // ─── PREMIUM SUPPORT layer (sotto al cibo) ───
    // Genera un supporto SVG (tagliere/bowl/piatto/coaster) in base alla categoria.
    // Cerca prima un PNG custom in public/brand-references/supports/{cat}.png
    const supportsDir = path.join(dir, "supports");
    const supportFiles = await readdir(supportsDir).catch(() => []);
    const customSupport = supportFiles.find(f => f.startsWith(supportCat + ".") || f.startsWith(supportCat + "-"));
    let supportPng: Buffer;
    if (customSupport) {
      supportPng = await sharp(await readFile(path.join(supportsDir, customSupport)))
        .resize({ width: W, height: H, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    } else {
      supportPng = await sharp(Buffer.from(generateSupportSvg(supportCat, W, H))).png().toBuffer();
    }

    const composites: Array<{ input: Buffer; top: number; left: number }> = [
      { input: supportPng, top: 0, left: 0 },
      { input: dishResized, top: dishTop, left: dishLeft },
    ];

    // Logo SVG solo se manca il template (fallback)
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
