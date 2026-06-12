import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { SAMPLE_MENU } from "@/lib/menuData";

export const maxDuration = 300; // 5 min per categoria grossa

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const TABLE = "menu_items";
const BUCKET = "menu-photos";

interface Report {
  total: number;
  enhanced: number;
  skipped: string[];
  errors: { name: string; error: string }[];
  inserted: string[];
}

async function enhanceImage(imageBuffer: Buffer, origin: string): Promise<string> {
  const dataUrl = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
  const res = await fetch(`${origin}/api/enhance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: dataUrl, mimeType: "image/jpeg" }),
  });
  const data = await res.json();
  if (!res.ok || !data.imageDataUrl) throw new Error(data.error || "AI enhance failed");
  return data.imageDataUrl as string;
}

export async function POST(req: NextRequest) {
  try {
    const { category } = await req.json();
    if (!category) return NextResponse.json({ error: "Missing category" }, { status: 400 });

    const items = SAMPLE_MENU.filter(i => i.category === category && i.available);
    if (items.length === 0) return NextResponse.json({ error: `Nessun piatto nella categoria ${category}` }, { status: 404 });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const report: Report = { total: items.length, enhanced: 0, skipped: [], errors: [], inserted: [] };

    // origin per chiamata interna
    const origin = new URL(req.url).origin;

    // Carica nomi già su Supabase per evitare duplicati
    const { data: existing } = await supabase.from(TABLE).select("name");
    const existingNames = new Set((existing ?? []).map((r: { name: string }) => r.name.toLowerCase()));

    for (const item of items) {
      try {
        if (existingNames.has(item.name.toLowerCase())) {
          report.skipped.push(`${item.name} (già presente)`);
          continue;
        }

        // 1. Read source image
        const imgPath = item.image.startsWith("/") ? item.image.slice(1) : item.image;
        const buffer = await readFile(path.join(process.cwd(), "public", imgPath));

        // 2. Send to Nano Banana
        console.log(`Enhancing ${item.name}...`);
        const enhanced = await enhanceImage(buffer, origin);
        report.enhanced++;

        // 3. Upload to Supabase Storage
        const enhancedBuf = await (await fetch(enhanced)).blob();
        const safe = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const storagePath = `${safe}-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from(BUCKET)
          .upload(storagePath, enhancedBuf, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

        // 4. Insert into menu_items
        const { error: insErr } = await supabase.from(TABLE).insert({
          name: item.name,
          description: item.description,
          story: item.story ?? "",
          price: item.price,
          category: item.category,
          image: pub.publicUrl,
          image_path: storagePath,
          tags: item.tags ?? [],
          available: true,
        });
        if (insErr) throw insErr;

        report.inserted.push(item.name);
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
