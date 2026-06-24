"use client";

import { supabase } from "./supabase";

export interface RemoteMenuItem {
  id: string;
  name: string;
  description: string;
  story?: string;
  price: number;
  category: string;
  image: string;
  imagePath?: string;
  tags: string[];
  available: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isSpicy?: boolean;
  isGlutenFree?: boolean;
  createdAt?: string;
}

const TABLE = "menu_items";
const BUCKET = "menu-photos";

interface DbRow {
  id: string;
  name: string;
  description: string | null;
  story: string | null;
  price: number;
  category: string;
  image: string | null;
  image_path: string | null;
  tags: string[] | null;
  available: boolean;
  is_vegetarian?: boolean | null;
  is_vegan?: boolean | null;
  is_spicy?: boolean | null;
  is_gluten_free?: boolean | null;
  created_at: string;
}

function rowToItem(row: DbRow): RemoteMenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    story: row.story ?? "",
    price: Number(row.price),
    category: row.category,
    image: row.image ?? "",
    imagePath: row.image_path ?? undefined,
    tags: row.tags ?? [],
    available: row.available,
    isVegetarian: !!row.is_vegetarian,
    isVegan: !!row.is_vegan,
    isSpicy: !!row.is_spicy,
    isGlutenFree: !!row.is_gluten_free,
    createdAt: row.created_at,
  };
}

/** Sottoscrivi al menu in tempo reale. Ritorna unsubscribe. */
export function subscribeMenu(callback: (items: RemoteMenuItem[]) => void): () => void {
  // Carica iniziale
  const load = async () => {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error("Errore caricamento menu:", error); return; }
    callback((data as DbRow[]).map(rowToItem));
  };
  load();

  // Real-time subscription
  const channel = supabase
    .channel("menu_items_changes")
    .on("postgres_changes",
      { event: "*", schema: "public", table: TABLE },
      () => load()
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

/** Carica foto base64 dataURL su Supabase Storage. */
export async function uploadMenuPhoto(dataUrl: string, dishName: string): Promise<{ url: string; path: string }> {
  // base64 dataURL → Blob
  const res = await fetch(dataUrl);
  const blob = await res.blob();

  const safe = dishName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "dish";
  const path = `${safe}-${Date.now()}.jpg`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (uploadErr) throw uploadErr;

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: pub.publicUrl, path };
}

/** Aggiungi un nuovo piatto. */
export async function addMenuItem(item: {
  name: string; description?: string; story?: string;
  price: number; category: string; tags?: string[];
  photoDataUrl?: string | null;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isSpicy?: boolean;
  isGlutenFree?: boolean;
}): Promise<string> {
  let image = "";
  let image_path: string | null = null;

  if (item.photoDataUrl && item.photoDataUrl.startsWith("data:")) {
    const uploaded = await uploadMenuPhoto(item.photoDataUrl, item.name);
    image = uploaded.url;
    image_path = uploaded.path;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      name: item.name,
      description: item.description ?? "",
      story: item.story ?? "",
      price: item.price,
      category: item.category,
      image,
      image_path,
      tags: item.tags ?? [],
      available: true,
      is_vegetarian: !!item.isVegetarian,
      is_vegan: !!item.isVegan,
      is_spicy: !!item.isSpicy,
      is_gluten_free: !!item.isGlutenFree,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

/** Aggiorna campi. */
export async function updateMenuItem(id: string, patch: Partial<Omit<RemoteMenuItem, "id">>): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.story !== undefined) dbPatch.story = patch.story;
  if (patch.price !== undefined) dbPatch.price = patch.price;
  if (patch.category !== undefined) dbPatch.category = patch.category;
  if (patch.image !== undefined) dbPatch.image = patch.image;
  if (patch.imagePath !== undefined) dbPatch.image_path = patch.imagePath;
  if (patch.tags !== undefined) dbPatch.tags = patch.tags;
  if (patch.available !== undefined) dbPatch.available = patch.available;
  if (patch.isVegetarian !== undefined) dbPatch.is_vegetarian = patch.isVegetarian;
  if (patch.isVegan !== undefined) dbPatch.is_vegan = patch.isVegan;
  if (patch.isSpicy !== undefined) dbPatch.is_spicy = patch.isSpicy;
  if (patch.isGlutenFree !== undefined) dbPatch.is_gluten_free = patch.isGlutenFree;

  const { error } = await supabase.from(TABLE).update(dbPatch).eq("id", id);
  if (error) throw error;
}

/** Elimina piatto + foto. */
export async function deleteMenuItem(id: string, imagePath?: string): Promise<void> {
  if (imagePath) {
    try { await supabase.storage.from(BUCKET).remove([imagePath]); } catch {}
  }
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
