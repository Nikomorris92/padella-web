import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;

const BUCKET = "menu-photos";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // 1. Carica record
    const { data: item, error: e1 } = await sb.from("menu_items")
      .select("id,name,description,image,image_path")
      .eq("id", id).single();
    if (e1 || !item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    // 2. Scarica immagine corrente
    const imgRes = await fetch(item.image);
    const imgBuf = Buffer.from(await imgRes.arrayBuffer());
    const dataUrl = `data:image/jpeg;base64,${imgBuf.toString("base64")}`;

    // 3. Manda a Nano Banana (ora che il billing è attivo)
    const origin = new URL(req.url).origin;
    const enhanceRes = await fetch(`${origin}/api/enhance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: dataUrl, mimeType: "image/jpeg" }),
    });
    const enhanceData = await enhanceRes.json();
    if (!enhanceRes.ok || !enhanceData.imageDataUrl) {
      return NextResponse.json({ error: "AI enhance failed", detail: enhanceData.error }, { status: 500 });
    }

    // 4. Carica nuova versione su Storage
    const cleanB64 = (enhanceData.imageDataUrl as string).replace(/^data:image\/\w+;base64,/, "");
    const newBuf = Buffer.from(cleanB64, "base64");
    const safe = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const newPath = `${safe}-ai-${Date.now()}.jpg`;
    const blob = new Blob([newBuf], { type: "image/jpeg" });
    const { error: upErr } = await sb.storage.from(BUCKET).upload(newPath, blob, { contentType: "image/jpeg" });
    if (upErr) return NextResponse.json({ error: "Upload failed: " + upErr.message }, { status: 500 });
    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(newPath);

    // 5. Aggiorna record
    const { error: updErr } = await sb.from("menu_items")
      .update({ image: pub.publicUrl, image_path: newPath })
      .eq("id", id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // 6. Cancella vecchia foto
    if (item.image_path) {
      try { await sb.storage.from(BUCKET).remove([item.image_path]); } catch {}
    }

    return NextResponse.json({ ok: true, name: item.name, newImage: pub.publicUrl });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
