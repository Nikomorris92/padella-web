import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_INSTRUCTION = `You are the AI admin assistant for "Padella Bangkok", an Italian restaurant + padel club + pool. The owner talks to you to manage the website.

You can use tools to:
- Read/update/delete menu items
- Add new menu items
- Read/update site configuration (contacts, hours, address, tagline, theme colors, homepage section visibility)

Rules:
- Reply in the SAME LANGUAGE the user wrote in (Italian or English).
- When the user asks to make a change, USE THE TOOLS — don't just describe what would change. Call the correct tool and confirm in natural language with a brief summary.
- Before destructive actions (delete), confirm what will be deleted.
- For colors: accept hex (e.g. "#C9A84C") or color names (e.g. "darker gold" → choose a sensible hex).
- For prices, default currency is THB.
- Keep responses concise and friendly. Use emojis sparingly (one or two when meaningful).
- If you cannot do something with the available tools, say so clearly and suggest an alternative.

Available menu categories: pasta, pizza, starter, main, salad, dessert, cocktails, beer, coffee, smoothies, soft-drinks, snack, panini, fusion, breakfast, daily-special.

Available site_config keys (you can set/get any of these):
- Contacts: whatsapp, line_id, address, hours
- Texts: tagline_home (homepage tagline)
- Theme colors: theme_gold (hex), theme_green (hex)
- Fonts: font_heading (Google Fonts name, e.g. "Playfair Display", "Cormorant Garamond"), font_body (e.g. "Inter", "DM Sans", "Manrope")
- Homepage sections: show_section_padel, show_section_pool, show_section_events, show_section_gallery, show_section_community (true/false)
- Layout flags: show_category_count (true/false — show a badge with the number of items next to each category in the menu)

For any UI flag you need that isn't in the list above, you can still create it via update_site_config with a custom key — but the frontend must be wired to read it. If unsure, list_site_config first to see what exists, or just ASK the user.

When the user asks for a font, suggest popular pairings (e.g. "Playfair Display" + "Inter", "Cormorant Garamond" + "Manrope", "DM Serif Display" + "DM Sans"). Confirm the choice with a brief note.`;

const TOOLS = [{
  functionDeclarations: [
    {
      name: "list_menu_items",
      description: "List all menu items. Optionally filter by category.",
      parameters: { type: "OBJECT", properties: { category: { type: "STRING", description: "Optional category filter" } } },
    },
    {
      name: "add_menu_item",
      description: "Create a new menu item.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          description: { type: "STRING" },
          price: { type: "NUMBER" },
          category: { type: "STRING" },
          available: { type: "BOOLEAN" },
        },
        required: ["name", "price", "category"],
      },
    },
    {
      name: "update_menu_item",
      description: "Update fields of a menu item by id or by exact name. Provide ONLY the fields to change.",
      parameters: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          name: { type: "STRING" },
          new_name: { type: "STRING" },
          new_description: { type: "STRING" },
          new_price: { type: "NUMBER" },
          new_category: { type: "STRING" },
          new_available: { type: "BOOLEAN" },
        },
      },
    },
    {
      name: "delete_menu_item",
      description: "Delete a menu item by id or exact name.",
      parameters: {
        type: "OBJECT",
        properties: { id: { type: "STRING" }, name: { type: "STRING" } },
      },
    },
    {
      name: "get_site_config",
      description: "Get the current site configuration (all keys or one specific key).",
      parameters: { type: "OBJECT", properties: { key: { type: "STRING", description: "Optional specific key" } } },
    },
    {
      name: "update_site_config",
      description: "Update a single site_config key with a new value.",
      parameters: {
        type: "OBJECT",
        properties: {
          key: { type: "STRING", description: "The config key" },
          value: { type: "STRING", description: "The new value, as JSON string. Use 'true'/'false' for booleans, '#C9A84C' for colors, quoted strings for text." },
        },
        required: ["key", "value"],
      },
    },
  ],
}];

interface ToolCallArgs { [k: string]: unknown }

async function execTool(name: string, args: ToolCallArgs, sb: ReturnType<typeof createClient>): Promise<unknown> {
  switch (name) {
    case "list_menu_items": {
      let q = sb.from("menu_items").select("id,name,description,price,category,available");
      if (args.category) q = q.eq("category", args.category as string);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) return { error: error.message };
      return { items: data, count: data?.length ?? 0 };
    }
    case "add_menu_item": {
      const { data, error } = await sb.from("menu_items").insert({
        name: args.name, description: args.description ?? "", price: args.price,
        category: args.category, available: args.available ?? true, tags: [],
      }).select("id,name").single();
      if (error) return { error: error.message };
      return { ok: true, item: data };
    }
    case "update_menu_item": {
      const patch: Record<string, unknown> = {};
      if (args.new_name !== undefined) patch.name = args.new_name;
      if (args.new_description !== undefined) patch.description = args.new_description;
      if (args.new_price !== undefined) patch.price = args.new_price;
      if (args.new_category !== undefined) patch.category = args.new_category;
      if (args.new_available !== undefined) patch.available = args.new_available;
      let q = sb.from("menu_items").update(patch);
      if (args.id) q = q.eq("id", args.id as string);
      else if (args.name) q = q.eq("name", args.name as string);
      else return { error: "Provide id or name" };
      const { data, error } = await q.select("id,name");
      if (error) return { error: error.message };
      return { ok: true, updated: data?.length ?? 0, items: data };
    }
    case "delete_menu_item": {
      let q = sb.from("menu_items").delete();
      if (args.id) q = q.eq("id", args.id as string);
      else if (args.name) q = q.eq("name", args.name as string);
      else return { error: "Provide id or name" };
      const { data, error } = await q.select("id,name");
      if (error) return { error: error.message };
      return { ok: true, deleted: data?.length ?? 0, items: data };
    }
    case "get_site_config": {
      if (args.key) {
        const { data } = await sb.from("site_config").select("value").eq("key", args.key as string).single();
        return { key: args.key, value: data?.value };
      }
      const { data } = await sb.from("site_config").select("key,value");
      const out: Record<string, unknown> = {};
      for (const r of data ?? []) out[(r as { key: string }).key] = (r as { value: unknown }).value;
      return out;
    }
    case "update_site_config": {
      let parsed: unknown = args.value;
      if (typeof args.value === "string") {
        try { parsed = JSON.parse(args.value as string); } catch { parsed = args.value; }
      }
      const { error } = await sb.from("site_config").upsert({
        key: args.key, value: parsed, updated_at: new Date().toISOString(),
      });
      if (error) return { error: error.message };
      return { ok: true, key: args.key, value: parsed };
    }
  }
  return { error: "Unknown tool: " + name };
}

interface GeminiPart { text?: string; functionCall?: { name: string; args: ToolCallArgs }; functionResponse?: { name: string; response: unknown } }
interface GeminiMsg { role: "user" | "model"; parts: GeminiPart[] }

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as { messages: Array<{ role: "user" | "assistant"; text: string }> };
    if (!messages?.length) return NextResponse.json({ error: "Missing messages" }, { status: 400 });

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GOOGLE_AI_API_KEY missing" }, { status: 500 });

    // Usa il token Bearer dell'admin loggato per passare RLS
    const authHeader = req.headers.get("authorization");
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined
    );

    // Converti i messaggi al formato Gemini
    const contents: GeminiMsg[] = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    const toolsExecuted: Array<{ name: string; args: ToolCallArgs; result: unknown }> = [];

    // Loop: chiama Gemini → se vuole tool, eseguilo → ripeti finché non c'è solo testo
    for (let i = 0; i < 6; i++) {
      const body = {
        systemInstruction: { role: "system", parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents,
        tools: TOOLS,
        generationConfig: { temperature: 0.6 },
      };

      const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        return NextResponse.json({ error: `Gemini ${res.status}: ${txt.slice(0,300)}` }, { status: 500 });
      }
      const data = await res.json();
      const parts: GeminiPart[] = data?.candidates?.[0]?.content?.parts ?? [];
      const fnCalls = parts.filter(p => p.functionCall);

      // Aggiungi la risposta del modello al contesto
      contents.push({ role: "model", parts });

      if (fnCalls.length === 0) {
        const text = parts.map(p => p.text).filter(Boolean).join("\n");
        return NextResponse.json({ reply: text || "(nessuna risposta)", toolsExecuted });
      }

      // Esegui tutti i tool call e prepara la risposta
      const toolResponses: GeminiPart[] = [];
      for (const p of fnCalls) {
        const { name, args } = p.functionCall!;
        const result = await execTool(name, args, sb);
        toolsExecuted.push({ name, args, result });
        toolResponses.push({ functionResponse: { name, response: result as object } });
      }
      contents.push({ role: "user", parts: toolResponses });
    }

    return NextResponse.json({ reply: "(troppe iterazioni)", toolsExecuted });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
