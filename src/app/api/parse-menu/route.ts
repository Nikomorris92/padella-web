import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const CATEGORIES = ["pasta", "pizza", "starter", "main", "salad", "dessert", "cocktails", "beer", "coffee", "smoothies", "soft-drinks", "snack", "panini", "fusion", "breakfast", "daily-special"];

function buildPrompt(text: string, pending: PendingItem | null): string {
  return `You are parsing a free-text input from a restaurant manager who wants to add or modify a menu item.

Available categories (EXACTLY these, no others):
${CATEGORIES.join(", ")}

Italian → English category mapping:
- antipasto / antipasti → starter
- primo → pasta
- secondo → main
- contorno → salad
- dolce / dessert → dessert
- caffè → coffee
- birra → beer
- vino / cocktail → cocktails
- panino → panini
- colazione → breakfast

${pending ? `CURRENT PENDING ITEM (fields already filled from photo or previous input):
- name: ${pending.name ?? "(missing)"}
- category: ${pending.category ?? "(missing)"}
- description: ${pending.description ?? "(missing)"}
- price: ${pending.price ?? "(missing)"}

The user is replying to update/confirm this pending item.` : "There is no pending item — this is a fresh request."}

USER MESSAGE:
"${text}"

Detect the INTENT and extract fields. Return strict JSON, no markdown, no extra text:

{
  "intent": "<add | modify | confirm | cancel | unclear>",
  "name": "<dish name (2-5 words) or null>",
  "category": "<exactly one of the categories above, or null>",
  "price": <number or null>,
  "description": "<short ingredients list or tagline, or null>",
  "missing": ["<list of fields the user has NOT provided and which would still need to be filled, considering the pending item too>"],
  "explanation": "<one short sentence in the user's language explaining what you understood>"
}

Intent rules:
- "confirm" → user wrote "sì", "ok", "conferma", "yes", "vai", "perfetto", "salva", or similar confirmation word
- "cancel" → "no", "annulla", "stop", "cancella"
- "modify" → user is changing an existing field (e.g. "nome è Carbonara", "prezzo 250", "categoria pizza")
- "add" → user is providing new dish data (with or without all fields)
- "unclear" → input doesn't relate to menu management

Extract ONLY the fields the user explicitly mentioned. Do NOT invent.
If the user only mentions a price (e.g. "320 THB"), only "price" should be set and "intent" should be "modify" (since they're completing a pending item).

Output ONLY the JSON.`;
}

interface PendingItem {
  name?: string;
  category?: string;
  description?: string;
  price?: number;
}

export async function POST(req: NextRequest) {
  try {
    const { text, pending } = await req.json() as { text: string; pending: PendingItem | null };
    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GOOGLE_AI_API_KEY missing" }, { status: 500 });

    const body = {
      contents: [{
        role: "user",
        parts: [{ text: buildPrompt(text, pending) }],
      }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    };

    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Gemini ${res.status}: ${text.slice(0, 300)}` }, { status: 500 });
    }

    const data = await res.json();
    const out = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    interface Parsed { intent?: string; name?: string | null; category?: string | null; price?: number | null; description?: string | null; missing?: string[]; explanation?: string }
    let parsed: Parsed = {};
    try { parsed = JSON.parse(out); } catch {
      return NextResponse.json({ error: "AI returned invalid JSON", raw: out.slice(0, 300) }, { status: 500 });
    }

    // Validate category
    if (parsed.category && !CATEGORIES.includes(parsed.category)) {
      parsed.category = null;
    }

    return NextResponse.json({
      intent: parsed.intent ?? "unclear",
      name: parsed.name ?? null,
      category: parsed.category ?? null,
      price: parsed.price ?? null,
      description: parsed.description ?? null,
      missing: parsed.missing ?? [],
      explanation: parsed.explanation ?? "",
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
