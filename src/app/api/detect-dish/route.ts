import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const PROMPT = `You are looking at a food/drink photo for an Italian restaurant + padel club + pool ("Padella Bangkok").

Analyze the image and identify the dish.

OUTPUT FORMAT — strict JSON, no markdown, no extra text:
{
  "category": "<one of: pasta, pizza, starter, main, salad, dessert, cocktails, beer, coffee, smoothies, soft-drinks, snack, panini, fusion, breakfast, daily-special>",
  "is_beverage": <true|false — TRUE if the main subject is ANY drink container: glass with liquid, cup, mug, bottle, can, cocktail glass, wine glass, coffee cup, tea glass. FALSE only for solid food on plates.>,
  "suggested_name": "<short dish name, 2-5 words, in English. Examples: 'Pizza Margherita', 'Spaghetti Carbonara', 'Tiramisù', 'Aperol Spritz'>",
  "visible_ingredients": "<comma-separated short list of what you see, max 12 words>",
  "is_vegetarian": <true|false>,
  "is_vegan": <true|false>,
  "is_spicy": <true|false>,
  "is_gluten_free": <true|false>,
  "confidence": "<high | medium | low>"
}

Dietary detection rules — be DECISIVE, apply the tag whenever the dish clearly qualifies:
- is_vegetarian: TRUE if you see NO meat, ham, sausage, salami, prosciutto, bacon, fish, seafood, tuna, anchovies. Cheese, eggs, milk, cream, butter, honey are ALL vegetarian. Salads, pizza margherita, pasta al pomodoro, caprese, tiramisu, fruit, most desserts, most cocktails, coffee, smoothies, soft drinks → TRUE.
- is_vegan: TRUE if also no cheese/milk/cream/butter/eggs/honey. Plain fruit, pasta al pomodoro without cheese, most cocktails, most soft drinks, black coffee → TRUE.
- is_spicy: TRUE if visible chili peppers, spicy salami (diavola/spianata), chili oil/flakes, sriracha, wasabi.
- is_gluten_free: TRUE if NO pasta/pizza/bread/panini/pastry/cake/beer/batter/breadcrumbs. Salads, grilled meat/fish, risotto, fruit, cocktails, wine, spirits, soft drinks, coffee → TRUE.

Rule of thumb: if the dish OBVIOUSLY qualifies (a green salad IS vegetarian; a Coke IS vegan + gluten-free), mark TRUE. Only mark FALSE when a disqualifying ingredient is visible or reasonably expected.

Category mapping rules:
- A pizza (round flatbread with toppings) → "pizza"
- Pasta dish (spaghetti, penne, fettuccine, ravioli, lasagne, gnocchi) → "pasta"
- Appetizers (bruschetta, tagliere salumi, antipasti misti, olive, finger food) → "starter"
- Sandwich/panino → "panini"
- Main course meat or fish (steak, branzino, ossobuco, etc.) → "main"
- Salads → "salad"
- Sweet desserts (tiramisù, panna cotta, cannoli, gelato, cakes) → "dessert"
- Cocktails (Spritz, Negroni, mojito etc.) → "cocktails"
- Beer in glass/bottle → "beer"
- Espresso, cappuccino, latte → "coffee"
- Fruit smoothies → "smoothies"
- Sodas, juices, water → "soft-drinks"
- Light bites (chips, fries, popcorn) → "snack"
- Breakfast items (eggs, pancakes, cornetto) → "breakfast"
- Asian-Italian fusion → "fusion"

Be DECISIVE. If you see a round flatbread with cheese/tomato — it's a "pizza", not "starter". If unsure between two close categories, pick the most specific.

Confidence:
- "high": you can clearly see what it is
- "medium": likely but not 100% certain
- "low": image is blurry / weird angle / cannot really tell

Output ONLY the JSON object.`;

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType: hintedMime } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GOOGLE_AI_API_KEY missing" }, { status: 500 });

    // Estrai mime dalla dataURL se presente (più affidabile dell'hint)
    const mimeMatch = (imageBase64 as string).match(/^data:(image\/[a-z+]+);base64,/i);
    const mimeType = mimeMatch ? mimeMatch[1].toLowerCase() : (hintedMime ?? "image/jpeg");
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z+]+;base64,/i, "");

    const body = {
      contents: [{
        role: "user",
        parts: [
          { text: PROMPT },
          { inlineData: { mimeType, data: cleanBase64 } },
        ],
      }],
      generationConfig: {
        temperature: 0.2,
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
      return NextResponse.json({ error: `Gemini ${res.status}: ${text.slice(0,300)}` }, { status: 500 });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    interface Detected {
      category?: string; suggested_name?: string; visible_ingredients?: string;
      confidence?: string; is_beverage?: boolean;
      is_vegetarian?: boolean; is_vegan?: boolean; is_spicy?: boolean; is_gluten_free?: boolean;
    }
    let parsed: Detected = {};
    try { parsed = JSON.parse(text); } catch { /* fallback below */ }

    return NextResponse.json({
      category: parsed.category ?? "starter",
      is_beverage: !!parsed.is_beverage,
      suggested_name: parsed.suggested_name ?? "",
      visible_ingredients: parsed.visible_ingredients ?? "",
      confidence: parsed.confidence ?? "low",
      is_vegetarian: !!parsed.is_vegetarian,
      is_vegan: !!parsed.is_vegan,
      is_spicy: !!parsed.is_spicy,
      is_gluten_free: !!parsed.is_gluten_free,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
