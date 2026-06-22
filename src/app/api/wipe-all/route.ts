import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "auth required" }, { status: 401 });
  
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const results: Record<string, unknown> = {};

  // 1. Tutte le foto da Storage (menu-photos bucket)
  try {
    const { data: files } = await sb.storage.from("menu-photos").list("", { limit: 1000 });
    if (files && files.length > 0) {
      const paths = files.map(f => f.name);
      await sb.storage.from("menu-photos").remove(paths);
    }
    results.storage_files_removed = files?.length ?? 0;
  } catch (e) {
    results.storage_error = e instanceof Error ? e.message : "unknown";
  }

  // 2. Wipe menu_items
  const { data: menuDel, error: menuErr } = await sb.from("menu_items").delete().neq("id", "00000000-0000-0000-0000-000000000000").select("id");
  results.menu_items_deleted = menuDel?.length ?? 0;
  if (menuErr) results.menu_error = menuErr.message;

  // 3. Wipe reservations (se esiste)
  try {
    const { data: resDel } = await sb.from("reservations").delete().neq("id", "00000000-0000-0000-0000-000000000000").select("id");
    results.reservations_deleted = resDel?.length ?? 0;
  } catch { results.reservations_deleted = "table doesn't exist (skipped)"; }

  // 4. Wipe events (se esiste)
  try {
    const { data: evDel } = await sb.from("events").delete().neq("id", "00000000-0000-0000-0000-000000000000").select("id");
    results.events_deleted = evDel?.length ?? 0;
  } catch { results.events_deleted = "table doesn't exist (skipped)"; }

  return NextResponse.json({ ok: true, ...results });
}
