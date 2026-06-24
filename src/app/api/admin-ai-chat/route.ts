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
- ALWAYS reply in ENGLISH only. Never Italian, never any other language. All previews, confirmations, and explanations must be in English.
- For colors: accept hex (e.g. "#C9A84C") or color names (e.g. "darker gold" → choose a sensible hex).
- For prices, default currency is THB.
- Keep responses concise and friendly. Use emojis sparingly (one or two when meaningful).
- If you cannot do something with the available tools, say so clearly and suggest an alternative.

═══════════════════════════════════════════════════════════════════
MANDATORY TWO-STEP CONFIRMATION PATTERN (anti-error safety)
═══════════════════════════════════════════════════════════════════
For EVERY write action (add/update/delete menu items, update site_config) you MUST follow this 2-step flow:

STEP 1 — PREVIEW (do NOT call the tool yet)
  Reply ONLY with a formatted preview of what you're about to do. Use this EXACT structure in English:

    📋 **Preview** — please verify before confirming:

    • **Action**: <add | update | delete>
    • **Type**: <menu item | site configuration>
    • **Name**: <value>
    • **Category**: <value>
    • **Price**: <value> THB
    • **Description**: <value>
    • **Tags**: <🌱 vegetarian | 🌿 vegan | 🌶️ spicy | 🌾 gluten-free, or "none" — ALWAYS include this line for menu items, inferring from the description>
    • [other fields as relevant]

    Confirm? Reply **"yes"** to proceed, or tell me what to change.

STEP 2 — EXECUTE (only after the user replies "yes", "ok", "confirm", "go", "sì" or similar)
  NOW call the actual tool (add_menu_item / update_menu_item / delete_menu_item / update_site_config).
  After execution, reply briefly: "✅ Done: <Item name> added/updated/deleted."

If the user replies "no", "cancel", "change X" → ask what to change and re-show the preview with edits.

READ-ONLY tools (list_menu_items, get_site_config) do NOT need this confirmation — just call them immediately and show the result in English.

═══════════════════════════════════════════════════════════════════

CRITICAL — HOW TO PARSE "ADD MENU ITEM" REQUESTS:
The user often writes commands like:
  "categoria starter, nome Aperitivo Italiano, descrizione Selezione di salumi e formaggi serviti con grissini, prezzo 380"
  "Aggiungi una pizza Diavola a 320 baht — pomodoro, fior di latte, salame piccante"
  "Insert a tiramisù 180 THB classic recipe with mascarpone and savoiardi"

You MUST split this into the correct fields. NEVER put the whole sentence into 'name'.

- 'name' = ONLY the dish name (2-5 words max). Examples: "Aperitivo Italiano", "Pizza Diavola", "Tiramisù". NEVER include ingredients, price, or category in name.
- 'description' = the ingredients list or short tagline. Examples: "Selezione di salumi e formaggi con grissini", "pomodoro, fior di latte, salame piccante".
- 'price' = number only. Strip currency symbols ("THB", "baht", "฿", "B").
- 'category' = exactly one of the available categories listed below. If user says "antipasto" → map to "starter". If user says "primo" → "pasta". If "secondo" → "main". If "contorno" → "salad".

If any of these is unclear or missing, ASK the user for clarification BEFORE calling the tool. Never invent data.

Available menu categories: pasta, pizza, starter, main, salad, dessert, cocktails, beer, coffee, smoothies, soft-drinks, snack, panini, fusion, breakfast, daily-special.

DIETARY FILTER TAGS (vegetarian, vegan, spicy, gluten-free):
Each menu item has 4 boolean filter flags. When the user says things like:
- "The Margherita is vegetarian" / "Mark Diavola as spicy" / "Tiramisù has gluten" → call update_menu_item with the appropriate new_vegetarian/new_vegan/new_spicy/new_gluten_free.
- "Add spicy tag to Diavola" → update_menu_item with new_spicy: true.
- "Remove vegan from Caesar" → update_menu_item with new_vegan: false.
- When adding a new item, infer the flags from the description (no meat→vegetarian, chili→spicy, no pasta/bread→gluten-free). Be CONSERVATIVE: when in doubt, false.
Always include the dietary flags in the preview (e.g. "Tags: 🌱 vegetarian, 🌶️ spicy").

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
      description: "Create a new menu item. The user provides a free-text description (e.g. 'aggiungi pizza diavola 320 baht salame piccante categoria pizza'). You MUST extract each field separately — never put the whole sentence in 'name'.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: {
            type: "STRING",
            description: "ONLY the dish name — 2 to 5 words MAX (e.g. 'Pizza Diavola', 'Aperitivo Italiano', 'Tiramisù della Casa'). NEVER include ingredients, price, currency, category, or full descriptions here. If the user gives a long sentence, extract just the proper name of the dish.",
          },
          description: {
            type: "STRING",
            description: "Short list of ingredients or tagline (e.g. 'San Marzano tomato, fior di latte, spicy salami', 'Selezione di salumi e formaggi con grissini'). Keep under 150 chars. NEVER include price or category here.",
          },
          price: {
            type: "NUMBER",
            description: "Numeric price only — extract from user text. Strip 'THB', 'baht', '฿', 'B' and other currency markers.",
          },
          category: {
            type: "STRING",
            description: "EXACTLY one of: pasta, pizza, starter, main, salad, dessert, cocktails, beer, coffee, smoothies, soft-drinks, snack, panini, fusion, breakfast, daily-special. Map Italian: antipasto→starter, primo→pasta, secondo→main, contorno→salad, dolce→dessert.",
          },
          available: { type: "BOOLEAN", description: "Default true." },
          is_vegetarian: { type: "BOOLEAN", description: "True if no meat/fish (cheese/eggs allowed)." },
          is_vegan: { type: "BOOLEAN", description: "True if no animal products at all." },
          is_spicy: { type: "BOOLEAN", description: "True if spicy/chili." },
          is_gluten_free: { type: "BOOLEAN", description: "True if no pasta/pizza/bread/beer." },
        },
        required: ["name", "price", "category"],
      },
    },
    {
      name: "update_menu_item",
      description: "Update fields of a menu item by id or by exact name. Provide ONLY the fields to change. Use new_vegetarian/new_vegan/new_spicy/new_gluten_free to toggle dietary filter tags.",
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
          new_vegetarian: { type: "BOOLEAN", description: "Set vegetarian filter tag." },
          new_vegan: { type: "BOOLEAN", description: "Set vegan filter tag." },
          new_spicy: { type: "BOOLEAN", description: "Set spicy filter tag." },
          new_gluten_free: { type: "BOOLEAN", description: "Set gluten-free filter tag." },
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function execTool(name: string, args: ToolCallArgs, sb: any): Promise<unknown> {
  switch (name) {
    case "list_menu_items": {
      let q = sb.from("menu_items").select("id,name,description,price,category,available");
      if (args.category) q = q.eq("category", args.category as string);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) return { error: error.message };
      return { items: data, count: data?.length ?? 0 };
    }
    case "add_menu_item": {
      const payload = {
        name: args.name, description: args.description ?? "", price: args.price,
        category: args.category, available: args.available ?? true, tags: [],
        is_vegetarian: !!args.is_vegetarian,
        is_vegan: !!args.is_vegan,
        is_spicy: !!args.is_spicy,
        is_gluten_free: !!args.is_gluten_free,
      };
      const { data, error } = await sb.from("menu_items")
        .insert(payload as never)
        .select("id,name")
        .single();
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
      if (args.new_vegetarian !== undefined) patch.is_vegetarian = args.new_vegetarian;
      if (args.new_vegan !== undefined) patch.is_vegan = args.new_vegan;
      if (args.new_spicy !== undefined) patch.is_spicy = args.new_spicy;
      if (args.new_gluten_free !== undefined) patch.is_gluten_free = args.new_gluten_free;
      let q = sb.from("menu_items").update(patch as never);
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
        return { key: args.key, value: (data as { value?: unknown } | null)?.value };
      }
      const { data } = await sb.from("site_config").select("key,value");
      const out: Record<string, unknown> = {};
      for (const r of (data ?? []) as Array<{ key: string; value: unknown }>) out[r.key] = r.value;
      return out;
    }
    case "update_site_config": {
      let parsed: unknown = args.value;
      if (typeof args.value === "string") {
        try { parsed = JSON.parse(args.value as string); } catch { parsed = args.value; }
      }
      const { error } = await sb.from("site_config").upsert({
        key: args.key, value: parsed, updated_at: new Date().toISOString(),
      } as never);
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
