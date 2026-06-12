import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { names } = await req.json();
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const { data: existing } = await sb.from("menu_items").select("id,name,image_path").in("name", names);
  for (const p of existing ?? []) {
    if ((p as { image_path?: string }).image_path) {
      await sb.storage.from("menu-photos").remove([(p as { image_path: string }).image_path]);
    }
  }
  const { data, error } = await sb.from("menu_items").delete().in("name", names).select();
  return NextResponse.json({ deleted: data?.length ?? 0, error: error?.message ?? null });
}
