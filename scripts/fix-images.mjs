#!/usr/bin/env node
// scripts/fix-images.mjs
// -----------------------------------------------------------------------------
// SPEC: rimuove la fascia inferiore dalle immagini prodotto Padella Bangkok
// tramite inpainting Replicate (LaMa). Deterministico su rilevazione fascia,
// AI SOLO per la ricostruzione dei pixel mancanti. Nessun crop, nessuna
// coordinata hardcoded, nessun workaround Sharp.
//
// Uso:
//   npm run fix-images                             -> batch completo
//   npm run fix-images -- --only=lipton            -> solo item con quel nome/id (case-insensitive)
//   npm run fix-images -- --dry-run                -> download + detect + inpaint + validate, NO upload/DB
//
// ENV richieste (lette da .env.local):
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_KEY
//   REPLICATE_API_TOKEN
// -----------------------------------------------------------------------------

import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// ============================================================================
// ENV LOADER
// ============================================================================
async function loadEnv() {
  const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
  try {
    const content = await fs.readFile(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
      }
    }
  } catch {
    /* .env.local absent or unreadable: fall back to process.env */
  }
}
await loadEnv();

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const BUCKET = "menu-photos";
const BACKUP_PREFIX = "_backup"; // path prefix in same bucket

// Colore reale della fascia inferiore rasterizzata
const BAND_COLOR = { r: 8, g: 12, b: 18 };
const COLOR_TOLERANCE = 30;       // ±30 su ciascun canale
const BAND_ROW_THRESHOLD = 0.65;  // ≥65% pixel matching → riga = band
const MAX_BAND_SEARCH = 0.5;      // banda non oltre il 50% inferiore

if (!SB_URL || !SB_KEY || !REPLICATE_TOKEN) {
  console.error("[FATAL] Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, REPLICATE_API_TOKEN");
  process.exit(1);
}

// ============================================================================
// LOGGER (per-item structured log)
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

// Backup obbligatorio prima di ogni upload: copia l'originale in _backup/<timestamp>/<path>
async function backupOriginal(pathInBucket, originalBuf, runTimestamp) {
  const backupPath = `${BACKUP_PREFIX}/${runTimestamp}/${pathInBucket}`;
  await uploadImage(backupPath, originalBuf, "image/jpeg");
  return backupPath;
}

// ============================================================================
// DETECT MASK
// Analizza pixel dal basso verso l'alto. Nessuna coordinata fissa.
// Ritorna { maskPng, bandStartY, W, H } oppure null.
// ============================================================================
async function detectMask(imgBuf) {
  const { data, info } = await sharp(imgBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;

  const isBandRow = (y) => {
    let matches = 0;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (
        Math.abs(data[i]     - BAND_COLOR.r) < COLOR_TOLERANCE &&
        Math.abs(data[i + 1] - BAND_COLOR.g) < COLOR_TOLERANCE &&
        Math.abs(data[i + 2] - BAND_COLOR.b) < COLOR_TOLERANCE
      ) matches++;
    }
    return (matches / W) >= BAND_ROW_THRESHOLD;
  };

  const searchLimit = Math.floor(H * (1 - MAX_BAND_SEARCH));
  let bandStartY = -1;
  for (let y = H - 1; y >= searchLimit; y--) {
    if (isBandRow(y)) bandStartY = y;
    else if (bandStartY !== -1) break;
  }

  if (bandStartY === -1 || bandStartY >= H - 5) return null;

  const mask = Buffer.alloc(W * H, 0);
  for (let y = bandStartY; y < H; y++) {
    for (let x = 0; x < W; x++) mask[y * W + x] = 255;
  }
  const maskPng = await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
  return { maskPng, bandStartY, W, H };
}

// ============================================================================
// INPAINT (Replicate LaMa)
// Verifica preliminare esistenza modello con checkModelAvailable().
// Timeout 120s per polling.
// ============================================================================
const REPLICATE_MODEL = "cjwbw/lama";
const REPLICATE_POLL_INTERVAL = 2000; // ms
const REPLICATE_TIMEOUT = 120_000;    // 120s max per immagine

async function checkModelAvailable() {
  const r = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}`, {
    headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` },
  });
  if (r.status === 404) throw new Error(`Modello Replicate "${REPLICATE_MODEL}" non trovato (404). Aggiornare REPLICATE_MODEL.`);
  if (!r.ok) throw new Error(`Verifica modello ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

function toDataUrl(buf, mime) {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function inpaint(imgBuf, maskPng) {
  const imgDataUrl = toDataUrl(imgBuf, "image/jpeg");
  const maskDataUrl = toDataUrl(maskPng, "image/png");

  const startRes = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait=60",
    },
    body: JSON.stringify({ input: { image: imgDataUrl, mask: maskDataUrl } }),
  });
  if (!startRes.ok) throw new Error(`Replicate start ${startRes.status}: ${(await startRes.text()).slice(0, 300)}`);
  let pred = await startRes.json();

  const t0 = Date.now();
  while (pred.status === "starting" || pred.status === "processing") {
    if (Date.now() - t0 > REPLICATE_TIMEOUT) throw new Error("Replicate timeout (>120s)");
    await new Promise((r) => setTimeout(r, REPLICATE_POLL_INTERVAL));
    const pr = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` } });
    if (!pr.ok) throw new Error(`Replicate poll ${pr.status}`);
    pred = await pr.json();
  }
  if (pred.status !== "succeeded") throw new Error(`Replicate ${pred.status}: ${pred.error ?? "unknown"}`);

  const outputUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  if (!outputUrl) throw new Error("Replicate returned no output URL");
  const outRes = await fetch(outputUrl);
  if (!outRes.ok) throw new Error(`Replicate output download ${outRes.status}`);
  return Buffer.from(await outRes.arrayBuffer());
}

// ============================================================================
// VALIDATE — 6 controlli
// - file non vuoto
// - MIME immagine decodificabile
// - decodifica sharp OK
// - dimensioni identiche all'originale (o riscalate a match)
// - canali validi (3 o 4)
// - output ≠ maschera (compare mean pixel value against mask)
// - non nero/bianco
// ============================================================================
async function validate(outBuf, origW, origH, maskPng) {
  if (!outBuf || outBuf.length < 100) return { ok: false, reason: "output vuoto o troppo piccolo" };
  let meta;
  try {
    meta = await sharp(outBuf).metadata();
  } catch (e) {
    return { ok: false, reason: `decodifica fallita: ${e.message}` };
  }
  if (!meta.format || !["jpeg","png","webp","jpg"].includes(meta.format)) {
    return { ok: false, reason: `MIME non valido: ${meta.format}` };
  }
  if (!meta.width || !meta.height) return { ok: false, reason: "dimensioni assenti" };
  if (!meta.channels || (meta.channels !== 3 && meta.channels !== 4)) {
    return { ok: false, reason: `canali non validi: ${meta.channels}` };
  }

  let finalBuf = outBuf;
  if (meta.width !== origW || meta.height !== origH) {
    // Resize deterministico per matchare originale
    finalBuf = await sharp(outBuf).resize(origW, origH, { fit: "fill" }).jpeg({ quality: 90 }).toBuffer();
  }

  const stats = await sharp(finalBuf).stats();
  const meanRGB = stats.channels.slice(0, 3).map((c) => c.mean);
  const avg = (meanRGB[0] + meanRGB[1] + meanRGB[2]) / 3;
  if (avg < 5)   return { ok: false, reason: "output quasi nero" };
  if (avg > 250) return { ok: false, reason: "output quasi bianco" };

  // Confronto grossolano output vs mask: la mask è monocromatica (0 o 255 su singolo canale).
  // Se l'output ha stats simili alla mask (media ≈ 255 o ≈ 0 con std ≈ 0), è la mask.
  const stdRGB = stats.channels.slice(0, 3).map((c) => c.stdev);
  const stdAvg = (stdRGB[0] + stdRGB[1] + stdRGB[2]) / 3;
  if (stdAvg < 2) return { ok: false, reason: "output senza varianza (probabile mask)" };

  return { ok: true, buf: finalBuf };
}

// ============================================================================
// BATCH PROCESSOR
// ============================================================================
async function processItem(it, opts, runTimestamp) {
  logger.itemStart(it.name);
  logger.itemField("File", it.image_path);

  const imgBuf = await downloadImage(it.image);
  logger.itemField("Downloaded", `${imgBuf.length}B`);

  const detected = await detectMask(imgBuf);
  logger.itemField("Mask detected", detected ? "YES" : "NO");
  if (!detected) {
    logger.warn(`SKIP ${it.name}: fascia non rilevata`);
    return { status: "skipped", reason: "band not detected" };
  }
  const { maskPng, bandStartY, W, H } = detected;
  logger.itemField("Mask height", `${H - bandStartY}px (from y=${bandStartY})`);

  let outRaw;
  try {
    outRaw = await inpaint(imgBuf, maskPng);
    logger.itemField("Replicate", "SUCCESS");
  } catch (e) {
    logger.itemField("Replicate", `FAILED (${e.message})`);
    return { status: "failed", reason: `replicate: ${e.message}` };
  }

  const v = await validate(outRaw, W, H, maskPng);
  logger.itemField("Validation", v.ok ? "PASS" : `FAILED (${v.reason})`);
  if (!v.ok) return { status: "failed", reason: `validation: ${v.reason}` };

  if (opts.dryRun) {
    logger.itemField("Upload", "SKIPPED (dry-run)");
    return { status: "processed", dryRun: true };
  }

  // BACKUP obbligatorio prima di sovrascrivere
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
  return { only, dryRun };
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

  // Verifica preliminare modello Replicate
  try {
    const modelInfo = await checkModelAvailable();
    logger.info(`Modello Replicate OK: ${modelInfo.owner}/${modelInfo.name}`);
  } catch (e) {
    logger.err(e.message);
    process.exit(1);
  }

  const items = await fetchAllItems();
  const onlyLower = opts.only?.toLowerCase();
  const target = onlyLower
    ? items.filter((i) =>
        i.id.toLowerCase() === onlyLower ||
        i.name.toLowerCase().includes(onlyLower)
      )
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
  if (errors.length) {
    console.log(`\n──── DETTAGLI ────`);
    for (const e of errors) console.log(e);
  }
}

main().catch((e) => { console.error("[FATAL]", e); process.exit(1); });
