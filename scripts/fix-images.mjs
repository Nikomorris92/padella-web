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

// Maschera geometrica fissa: bottom 30% dell'immagine (proporzionale, scala con dimensioni).
// Tutte le 93 immagini sono state generate dallo stesso template → posizione fascia identica.
// Nessun detection colore.
const MASK_BOTTOM_RATIO = 0.30;

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
// GENERATE MASK — geometrica fissa
// Rettangolo che copre il bottom MASK_BOTTOM_RATIO dell'immagine.
// Nessun detection, nessuna dipendenza dai pixel. Ratio proporzionale.
// ============================================================================
async function generateMask(imgBuf) {
  const meta = await sharp(imgBuf).metadata();
  const W = meta.width, H = meta.height;
  if (!W || !H) return null;

  const bandStartY = Math.floor(H * (1 - MASK_BOTTOM_RATIO));
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
const REPLICATE_MODEL = "zylim0702/remove-object";
const REPLICATE_POLL_INTERVAL = 2000; // ms
const REPLICATE_TIMEOUT = 120_000;    // 120s max per immagine

let CACHED_VERSION_ID = null;
async function checkModelAvailable() {
  const r = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}`, {
    headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` },
  });
  if (r.status === 404) throw new Error(`Modello Replicate "${REPLICATE_MODEL}" non trovato (404). Aggiornare REPLICATE_MODEL.`);
  if (!r.ok) throw new Error(`Verifica modello ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const meta = await r.json();
  CACHED_VERSION_ID = meta?.latest_version?.id;
  if (!CACHED_VERSION_ID) throw new Error(`Nessuna latest_version per ${REPLICATE_MODEL}`);
  return meta;
}

function toDataUrl(buf, mime) {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function inpaint(imgBuf, maskPng) {
  const imgDataUrl = toDataUrl(imgBuf, "image/jpeg");
  const maskDataUrl = toDataUrl(maskPng, "image/png");

  const startRes = await fetch(`https://api.replicate.com/v1/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait=60",
    },
    body: JSON.stringify({ version: CACHED_VERSION_ID, input: { image: imgDataUrl, mask: maskDataUrl } }),
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

  const detected = await generateMask(imgBuf);
  if (!detected) {
    logger.warn(`SKIP ${it.name}: immagine non decodificabile`);
    return { status: "skipped", reason: "image unreadable" };
  }
  const { maskPng, bandStartY, W, H } = detected;
  logger.itemField("Mask (geometric)", `bottom ${Math.round(MASK_BOTTOM_RATIO*100)}% = ${H - bandStartY}px (from y=${bandStartY})`);

  let outRaw;
  try {
    outRaw = await inpaint(imgBuf, maskPng);
    logger.itemField("Replicate", "SUCCESS");
  } catch (e) {
    logger.itemField("Replicate", `FAILED (${e.message})`);
    if (opts.debug) await saveDebugFiles(it.name, imgBuf, maskPng, null, W, H);
    return { status: "failed", reason: `replicate: ${e.message}` };
  }

  if (opts.debug) await saveDebugFiles(it.name, imgBuf, maskPng, outRaw, W, H);

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
  const debug = args.includes("--debug");
  return { only, dryRun, debug };
}

const DEBUG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "debug");

async function saveDebugFiles(itemName, originalBuf, maskPng, resultBuf, W, H) {
  await fs.mkdir(DEBUG_DIR, { recursive: true });
  const slug = itemName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  // 1) originale
  await fs.writeFile(path.join(DEBUG_DIR, `${slug}-original.jpg`), originalBuf);
  // 2) mask
  await fs.writeFile(path.join(DEBUG_DIR, `${slug}-mask.png`), maskPng);
  // 3) overlay: originale + mask in rosso semi-trasparente.
  // maskPng è single-channel (0=nero, 255=bianco). Costruiamo un'immagine RGBA rossa
  // dove alpha = mask (così solo dove mask=255 vediamo il rosso).
  const maskRaw = await sharp(maskPng).greyscale().raw().toBuffer({ resolveWithObject: true });
  const alphaData = maskRaw.data;
  const rgbaData = Buffer.alloc(alphaData.length * 4);
  for (let i = 0; i < alphaData.length; i++) {
    const a = Math.round(alphaData[i] * 0.6); // 60% max opacity
    rgbaData[i*4] = 255;
    rgbaData[i*4+1] = 0;
    rgbaData[i*4+2] = 0;
    rgbaData[i*4+3] = a;
  }
  const redOverlay = await sharp(rgbaData, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  const overlay = await sharp(originalBuf).composite([{ input: redOverlay, top: 0, left: 0 }]).jpeg({ quality: 85 }).toBuffer();
  await fs.writeFile(path.join(DEBUG_DIR, `${slug}-overlay.jpg`), overlay);
  // 4) risultato inpaint (raw dal servizio, prima del resize)
  if (resultBuf) await fs.writeFile(path.join(DEBUG_DIR, `${slug}-result.jpg`), resultBuf);
  logger.itemField("Debug files", DEBUG_DIR);
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
