import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await sb.from("menu_items")
    .select("id,name,category,image,created_at")
    .order("created_at", { ascending: false });
  return NextResponse.json({ items: data });
}
