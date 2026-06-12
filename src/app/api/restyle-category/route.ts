import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, copyFile, mkdir } from "fs/promises";
import path from "path";
import { SAMPLE_MENU } from "@/lib/menuData";

export const maxDuration = 300;

interface Report {
  total: number;
  restyled: { name: string; image: string }[];
  errors: { name: string; error: string }[];
}

async function enhanceImage(imageBuffer: Buffer, origin: string): Promise<Buffer> {
  const dataUrl = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
  const res = await fetch(`${origin}/api/enhance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: dataUrl, mimeType: "image/jpeg" }),
  });
  const data = await res.json();
  if (!res.ok || !data.imageDataUrl) throw new Error(data.error || "AI enhance failed");
  const cleaned = (data.imageDataUrl as string).replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(cleaned, "base64");
}

/** Sostituisce i file sorgente in /public/images/food/ con la versione AI-enhanced.
 *  Backup originale in /public/images/food/_originals/ alla prima esecuzione. */
export async function POST(req: NextRequest) {
  try {
    const { category } = await req.json();
    if (!category) return NextResponse.json({ error: "Missing category" }, { status: 400 });

    const items = SAMPLE_MENU.filter(i => i.category === category && i.available && i.image);
    if (items.length === 0) return NextResponse.json({ error: `Nessun piatto in ${category}` }, { status: 404 });

    const origin = new URL(req.url).origin;
    const report: Report = { total: items.length, restyled: [], errors: [] };

    // Deduplica per path immagine (più piatti possono condividere lo stesso file)
    const seenPaths = new Set<string>();

    for (const item of items) {
      try {
        const relPath = item.image.startsWith("/") ? item.image.slice(1) : item.image;
        const absPath = path.join(process.cwd(), "public", relPath);

        if (seenPaths.has(absPath)) {
          report.restyled.push({ name: item.name, image: item.image + " (già processata)" });
          continue;
        }
        seenPaths.add(absPath);

        // Backup originale se non già fatto
        const dir = path.dirname(absPath);
        const base = path.basename(absPath);
        const backupDir = path.join(dir, "_originals");
        await mkdir(backupDir, { recursive: true });
        const backupPath = path.join(backupDir, base);
        try { await readFile(backupPath); }
        catch { await copyFile(absPath, backupPath); }

        // Leggi originale (dal backup, per essere sicuri di non re-enhanceare un già-enhanced)
        const sourceBuf = await readFile(backupPath);

        // Enhance via Nano Banana
        console.log(`Restyling ${item.name} (${base})...`);
        const enhanced = await enhanceImage(sourceBuf, origin);

        // Sovrascrivi il file originale
        await writeFile(absPath, enhanced);
        report.restyled.push({ name: item.name, image: item.image });
      } catch (err) {
        report.errors.push({ name: item.name, error: err instanceof Error ? err.message : "unknown" });
        console.error(`Errore su ${item.name}:`, err);
      }
    }

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
