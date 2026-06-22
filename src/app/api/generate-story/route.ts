import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function buildPrompt(name: string, category: string, ingredients: string): string {
  return `Write a 4-line storytelling for an Italian restaurant menu item.

CONTEXT:
- Restaurant: Padella Bangkok — premium Italian destination
- Dish name: ${name}
- Category: ${category}
- Visible ingredients / description: ${ingredients}

RULES:
- ALWAYS in English (never Italian, never another language).
- Exactly 4 short sentences, separated by newlines (\\n).
- Style: warm, evocative, premium restaurant. Mix tradition + craft + emotion.
- Focus on: origin/tradition, ingredients quality, preparation craft, sensory experience.
- Tone: confident, poetic but concrete. No clichés. No "delicious", "amazing".
- Length: each line 12-20 words, total 60-80 words.
- Do NOT mention the dish name in the text.
- Do NOT use bullet points, headings, or markdown.

OUTPUT: only the 4 lines separated by \\n, nothing else.`;
}

export async function POST(req: NextRequest) {
  try {
    const { name, category, ingredients } = await req.json() as { name?: string; category?: string; ingredients?: string };
    if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GOOGLE_AI_API_KEY missing" }, { status: 500 });

    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(name, category ?? "default", ingredients ?? "") }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 300 },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json({ error: `Gemini ${res.status}: ${t.slice(0, 200)}` }, { status: 500 });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const story = text.trim().replace(/^["']+|["']+$/g, "");
    return NextResponse.json({ story });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
