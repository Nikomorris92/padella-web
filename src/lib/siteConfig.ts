"use client";

import { supabase } from "./supabase";

const TABLE = "site_config";

export async function getConfig(key: string): Promise<unknown> {
  const { data } = await supabase.from(TABLE).select("value").eq("key", key).single();
  return data?.value;
}

export async function setConfig(key: string, value: unknown): Promise<void> {
  await supabase.from(TABLE).upsert({ key, value, updated_at: new Date().toISOString() });
}

export async function getAllConfig(): Promise<Record<string, unknown>> {
  const { data } = await supabase.from(TABLE).select("key,value");
  const out: Record<string, unknown> = {};
  for (const row of data ?? []) out[(row as { key: string }).key] = (row as { value: unknown }).value;
  return out;
}
