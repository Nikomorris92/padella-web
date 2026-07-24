#!/usr/bin/env node
// scripts/fix-images.mjs
// -----------------------------------------------------------------------------
// SPEC: rimuove la fascia inferiore dalle immagini prodotto Padella Bangkok
// tramite RICOSTRUZIONE DETERMINISTICA del pattern perforato.
// NO AI. NO inpainting. Solo sharp: copia texture da zona pulita → tile su area mask
// con feather sulla giunzione.
//
// Uso:
//   npm run fix-images                             -> batch completo
//   npm run fix-images -- --only=lipton            -> solo item con quel nome/id
//   npm run fix-images -- --dry-run                -> non fa upload/DB
//   npm run fix-images -- --debug                  -> salva file locali in /debug
//
// ENV (.env.local):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_KEY
// -----------------------------------------------------------------------------

import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// ============================================================================
// ENV
// ============================================================================
async function loadEnv() {
  const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
  try {
    const content = await fs.readFile(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch {}
}
await loadEnv();

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = "menu-photos";
const BACKUP_PREFIX = "_backup";

// Fascia da sostituire: bottom 30% dell'immagine.
const MASK_BOTTOM_RATIO = 0.30;
// Tile texture-source: piccolo quadrato di pattern PURO dall'angolo in alto a sinistra.
// Là c'è solo lo sfondo perforato (il soggetto è centrato). Il tile viene poi tilato H×V.
const TILE_SOURCE_LEFT_RATIO = 0.02;
const TILE_SOURCE_TOP_RATIO = 0.05;
const TILE_SOURCE_SIZE_RATIO = 0.18;  // 18% di W × 18% di H → tile abbastanza grande da non ripetersi visibilmente
// Feather sulla giunzione tra zona preservata e zona ricostruita
const FEATHER_HEIGHT_PX = 60;

if (!SB_URL || !SB_KEY) {
  console.error("[FATAL] Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(1);
}

// ============================================================================
// LOGGER
// ============================================================================
const logger = {
  info: (m) => console.log(`[INFO ] ${m}`),
  warn: (m) => console.warn(`[WARN ] ${m}`),
  err:  (m) => console.error(`[ERROR] ${m}`),
  itemStart: (name) => console.log(`\n──────── ${name} ────────`),
  itemField: (k, v) => console.log(`  ${k}: ${v}`),
};

// ============================================================================
// SUPABASE I/O
// ============================================================================
async function fetchAllItems() {
  const url = `${SB_URL}/rest/v1/menu_items?select=id,name,image,image_path&image=not.is.null`;
  const r = await fetch(url, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!r.ok) throw new Error(`Supabase list ${r.status}: ${await r.text()}`);
  return r.json();
}

async function downloadImage(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Download ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

async function uploadImage(pathInBucket, buf, contentType = "image/jpeg") {
  const r = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${pathInBucket}`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: buf,
  });
  if (!r.ok) throw new Error(`Upload ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

async function updateItemImageUrl(id, url) {
  const r = await fetch(`${SB_URL}/rest/v1/menu_items?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ image: url }),
  });
  if (!r.ok) throw new Error(`DB update ${r.status}`);
}

async function backupOriginal(pathInBucket, originalBuf, runTimestamp) {
  const backupPath = `${BACKUP_PREFIX}/${runTimestamp}/${pathInBucket}`;
  await uploadImage(backupPath, originalBuf, "image/jpeg");
  return backupPath;
}

// ============================================================================
// RECONSTRUCT
// Deterministico: campiona strip perforato pulito dall'alto, tila sull'area mask,
// feather sulla giunzione. Nessuna AI.
// ============================================================================
async function reconstruct(imgBuf) {
  const meta = await sharp(imgBuf).metadata();
  const W = meta.width, H = meta.height;
  if (!W || !H) throw new Error("no dims");

  const maskStartY = Math.floor(H * (1 - MASK_BOTTOM_RATIO));
  const areaHeight = H - maskStartY;

  // 1) Estrai TILE quadrato di pattern PURO dall'angolo top-left (dove non c'è il soggetto)
  const tileSize = Math.floor(Math.min(W, H) * TILE_SOURCE_SIZE_RATIO);
  const tileLeft = Math.floor(W * TILE_SOURCE_LEFT_RATIO);
  const tileTop = Math.floor(H * TILE_SOURCE_TOP_RATIO);
  if (tileSize <= 0) throw new Error("invalid tile size");
  const srcTop = tileTop, srcBot = tileTop + tileSize;

  const tileBuf = await sharp(imgBuf)
    .extract({ left: tileLeft, top: tileTop, width: tileSize, height: tileSize })
    .toBuffer();

  // 2) Tila il quadrato orizzontalmente E verticalmente per coprire l'intera area
  const cols = Math.ceil(W / tileSize);
  const rows = Math.ceil(areaHeight / tileSize);
  const composites = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      composites.push({ input: tileBuf, top: r * tileSize, left: c * tileSize });
    }
  }
  const tiledFull = await sharp({
    create: { width: cols * tileSize, height: rows * tileSize, channels: 3, background: { r: 0, g: 0, b: 0 } },
  }).composite(composites).png().toBuffer();

  const fillPatch = await sharp(tiledFull)
    .extract({ left: 0, top: 0, width: W, height: areaHeight })
    .toBuffer();

  // 3) Feather: crea una maschera alpha che fa fade smooth sulla giunzione superiore.
  //    Fill patch avrà alpha=0 nei primi FEATHER_HEIGHT_PX (blend graduale col fondo),
  //    poi alpha=255 nel resto. Sotto la giunzione texture 100% opaca.
  const featherH = Math.min(FEATHER_HEIGHT_PX, Math.floor(areaHeight / 3));
  const alphaBuf = Buffer.alloc(W * areaHeight);
  for (let y = 0; y < areaHeight; y++) {
    let a;
    if (y < featherH) {
      a = Math.round((y / featherH) * 255); // 0 → 255 smooth
    } else {
      a = 255;
    }
    for (let x = 0; x < W; x++) alphaBuf[y * W + x] = a;
  }
  const alphaPng = await sharp(alphaBuf, { raw: { width: W, height: areaHeight, channels: 1 } }).png().toBuffer();

  const fillPatchRgba = await sharp(fillPatch)
    .ensureAlpha()
    .joinChannel(alphaPng)
    .png()
    .toBuffer();

  // 4) Composite finale: sovrappone la patch alla foto originale, top=maskStartY
  const composed = await sharp(imgBuf)
    .composite([{ input: fillPatchRgba, top: maskStartY, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return { composed, maskStartY, areaHeight, srcTop, srcBot, W, H };
}

// ============================================================================
// VALIDATE
// ============================================================================
async function validate(outBuf, origW, origH) {
  if (!outBuf || outBuf.length < 100) return { ok: false, reason: "output vuoto" };
  let meta;
  try { meta = await sharp(outBuf).metadata(); }
  catch (e) { return { ok: false, reason: `decodifica fallita: ${e.message}` }; }
  if (!meta.format || !["jpeg","png","webp","jpg"].includes(meta.format)) return { ok: false, reason: `MIME: ${meta.format}` };
  if (meta.width !== origW || meta.height !== origH) return { ok: false, reason: `dim ${meta.width}x${meta.height} vs ${origW}x${origH}` };
  if (!meta.channels || (meta.channels !== 3 && meta.channels !== 4)) return { ok: false, reason: `canali: ${meta.channels}` };

  const stats = await sharp(outBuf).stats();
  const meanRGB = stats.channels.slice(0, 3).map((c) => c.mean);
  const avg = (meanRGB[0] + meanRGB[1] + meanRGB[2]) / 3;
  if (avg < 5) return { ok: false, reason: "output nero" };
  if (avg > 250) return { ok: false, reason: "output bianco" };
  const stdRGB = stats.channels.slice(0, 3).map((c) => c.stdev);
  const stdAvg = (stdRGB[0] + stdRGB[1] + stdRGB[2]) / 3;
  if (stdAvg < 2) return { ok: false, reason: "output senza varianza" };
  return { ok: true, buf: outBuf };
}

// ============================================================================
// DEBUG
// ============================================================================
const DEBUG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "debug");
async function saveDebugFiles(itemName, originalBuf, resultBuf, info) {
  await fs.mkdir(DEBUG_DIR, { recursive: true });
  const slug = itemName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  await fs.writeFile(path.join(DEBUG_DIR, `${slug}-original.jpg`), originalBuf);
  await fs.writeFile(path.join(DEBUG_DIR, `${slug}-result.jpg`), resultBuf);

  // Overlay: originale con rettangoli rossi (mask area) e verde (texture source)
  const { W, H, maskStartY, srcTop, srcBot } = info;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect x="0" y="${maskStartY}" width="${W}" height="${H - maskStartY}" fill="red" fill-opacity="0.3"/>
    <rect x="0" y="${srcTop}" width="${W}" height="${srcBot - srcTop}" fill="lime" fill-opacity="0.25"/>
  </svg>`;
  const overlay = await sharp(originalBuf).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 85 }).toBuffer();
  await fs.writeFile(path.join(DEBUG_DIR, `${slug}-overlay.jpg`), overlay);
  logger.itemField("Debug", DEBUG_DIR);
}

// ============================================================================
// BATCH PROCESSOR
// ============================================================================
async function processItem(it, opts, runTimestamp) {
  logger.itemStart(it.name);
  logger.itemField("File", it.image_path);

  const imgBuf = await downloadImage(it.image);
  logger.itemField("Downloaded", `${imgBuf.length}B`);

  let recon;
  try {
    recon = await reconstruct(imgBuf);
    logger.itemField("Reconstruct", `mask=${recon.H - recon.maskStartY}px, tex=${recon.srcBot - recon.srcTop}px`);
  } catch (e) {
    logger.itemField("Reconstruct", `FAILED (${e.message})`);
    return { status: "failed", reason: `reconstruct: ${e.message}` };
  }

  if (opts.debug) await saveDebugFiles(it.name, imgBuf, recon.composed, recon);

  const v = await validate(recon.composed, recon.W, recon.H);
  logger.itemField("Validation", v.ok ? "PASS" : `FAILED (${v.reason})`);
  if (!v.ok) return { status: "failed", reason: `validation: ${v.reason}` };

  if (opts.dryRun) {
    logger.itemField("Upload", "SKIPPED (dry-run)");
    return { status: "processed", dryRun: true };
  }

  const backupPath = await backupOriginal(it.image_path, imgBuf, runTimestamp);
  logger.itemField("Backup", backupPath);
  await uploadImage(it.image_path, v.buf);
  const newUrl = `${SB_URL}/storage/v1/object/public/${BUCKET}/${it.image_path}?v=${Date.now()}`;
  await updateItemImageUrl(it.id, newUrl);
  logger.itemField("Upload", "SUCCESS");
  return { status: "processed" };
}

// ============================================================================
// CLI
// ============================================================================
function parseArgs() {
  const args = process.argv.slice(2);
  const only = args.find((a) => a.startsWith("--only="))?.split("=")[1];
  const dryRun = args.includes("--dry-run");
  const debug = args.includes("--debug");
  return { only, dryRun, debug };
}

function makeRunTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function main() {
  const opts = parseArgs();
  const runTimestamp = makeRunTimestamp();
  logger.info(`Start (dry-run=${opts.dryRun}, only=${opts.only ?? "all"}, run=${runTimestamp})`);
  const items = await fetchAllItems();
  const onlyLower = opts.only?.toLowerCase();
  const target = onlyLower
    ? items.filter((i) => i.id.toLowerCase() === onlyLower || i.name.toLowerCase().includes(onlyLower))
    : items;
  logger.info(`${target.length} item(s) da processare`);
  if (target.length === 0) { logger.warn("Nessun item selezionato"); process.exit(0); }

  let processed = 0, failed = 0, skipped = 0;
  const errors = [];
  for (const it of target) {
    try {
      const res = await processItem(it, opts, runTimestamp);
      if (res.status === "processed") processed++;
      else if (res.status === "skipped") { skipped++; errors.push(`SKIP ${it.name}: ${res.reason}`); }
      else { failed++; errors.push(`FAIL ${it.name}: ${res.reason}`); }
    } catch (e) {
      failed++;
      errors.push(`EXC ${it.name}: ${e.message}`);
      logger.err(`EXCEPTION ${it.name}: ${e.message}`);
    }
  }

  console.log(`\n──── REPORT ────`);
  console.log(`Processed: ${processed}`);
  console.log(`Skipped:   ${skipped}`);
  console.log(`Failed:    ${failed}`);
  if (!opts.dryRun && processed > 0) console.log(`Backup dir: ${BACKUP_PREFIX}/${runTimestamp}/`);
  if (errors.length) { console.log(`\n──── DETTAGLI ────`); for (const e of errors) console.log(e); }
}

main().catch((e) => { console.error("[FATAL]", e); process.exit(1); });
