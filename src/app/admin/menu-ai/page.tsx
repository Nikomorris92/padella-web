"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ImagePlus, X, Check, Sparkles, Loader2, ChefHat, Wand2 } from "lucide-react";
import { MENU_CATEGORIES } from "@/lib/menuData";
import { addMenuItem } from "@/lib/menuRepo";

/** Background removal client-side via @imgly/background-removal (WASM).
 *  PRESERVA i pixel originali del piatto (nessuna AI regeneration). */
async function removeBackgroundClient(dataUrl: string): Promise<string> {
  const { removeBackground } = await import("@imgly/background-removal");
  // Riconverte dataURL → Blob
  const blob = await (await fetch(dataUrl)).blob();
  const resultBlob = await removeBackground(blob, {
    output: { format: "image/png", quality: 0.95 },
  });
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(resultBlob);
  });
}

const CATEGORY_EMOJI: Record<string, string> = {
  pasta:"🍝",pizza:"🍕",starter:"🫒",cocktails:"🍹",dessert:"🍮",
  main:"🥩",snack:"🥨",salad:"🥗",smoothies:"🥭",coffee:"☕",
  beer:"🍺",panini:"🥪",fusion:"🌟",breakfast:"🌅","daily-special":"⭐","soft-drinks":"🥤",
};

interface MenuItem {
  id: string; name: string; description: string; price: number;
  category: string; story: string; img: string | null; tags: string[];
}

type MsgRole = "user" | "ai" | "system";
type UploadStage = "reading" | "filtering" | "done" | "error";
interface Msg { id: number; role: MsgRole; text: string; img?: string; card?: MenuItem; uploadStage?: UploadStage; uploadProgress?: number; }

// ── Canvas brand filter ────────────────────────────────────────────────────
function applyBrandFilter(src: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const SIZE = 700;
      const c = document.createElement("canvas");
      c.width = c.height = SIZE;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#1B3A2D";
      ctx.fillRect(0, 0, SIZE, SIZE);
      const r = img.naturalWidth / img.naturalHeight;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (r > 1) { sx = (sw - sh) / 2; sw = sh; } else { sy = (sh - sw) / 2; sh = sw; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SIZE, SIZE);
      const id = ctx.getImageData(0, 0, SIZE, SIZE); const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        let r2 = d[i], g = d[i+1], b = d[i+2];
        r2 *= 1.05; g *= 1.05; b *= 1.05;
        r2 = (r2-128)*1.18+128; g = (g-128)*1.18+128; b = (b-128)*1.18+128;
        const gray = 0.299*r2 + 0.587*g + 0.114*b;
        r2 = gray+(r2-gray)*0.82; g = gray+(g-gray)*0.82; b = gray+(b-gray)*0.82;
        const lum = (r2+g+b)/3; const w = (1-lum/255)*18;
        r2 += w; g += w*0.5; b -= w*0.3;
        d[i]=Math.max(0,Math.min(255,r2)); d[i+1]=Math.max(0,Math.min(255,g)); d[i+2]=Math.max(0,Math.min(255,b));
      }
      ctx.putImageData(id, 0, 0);
      const vig = ctx.createRadialGradient(SIZE/2,SIZE/2,SIZE*0.35,SIZE/2,SIZE/2,SIZE*0.75);
      vig.addColorStop(0,"rgba(0,0,0,0)"); vig.addColorStop(1,"rgba(0,0,0,0.4)");
      ctx.fillStyle = vig; ctx.fillRect(0,0,SIZE,SIZE);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.src = src;
  });
}

// ── AI text parser ─────────────────────────────────────────────────────────
function parseMenuCommand(text: string, pendingImg: string | null): Partial<MenuItem> & { reply: string } {
  const low = text.toLowerCase();
  const priceMatch = text.match(/(\d{2,4})\s*(thb|baht|฿)?/i);
  const price = priceMatch ? parseInt(priceMatch[1]) : 280;

  let category = "pasta";
  for (const c of MENU_CATEGORIES) {
    if (low.includes(c.label.toLowerCase()) || low.includes(c.id)) { category = c.id; break; }
  }

  const nameRaw = text
    .replace(/aggiungi|add|inserisci|nuovo/gi,"")
    .replace(/\d+\s*(thb|baht|฿)/gi,"")
    .replace(new RegExp(Object.values(MENU_CATEGORIES).map(c=>c.label).join("|"),"gi"),"")
    .replace(/categoria|category|alla|nel menu/gi,"")
    .trim();

  const name = nameRaw.split(" ").filter(Boolean).map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(" ");

  // Se mancano dati essenziali (nome o prezzo non rilevato), chiedi all'utente
  if (!name || !priceMatch) {
    const missing: string[] = [];
    if (!name) missing.push("**nome del piatto**");
    if (!priceMatch) missing.push("**prezzo** (es. 280 THB)");
    return {
      name: name || "",
      category,
      price: 0,
      description: "",
      story: "",
      tags: [category],
      img: pendingImg,
      reply: `Ho capito la categoria **${MENU_CATEGORIES.find(c=>c.id===category)?.label ?? category}** ${CATEGORY_EMOJI[category]}, ma mi serve ancora ${missing.join(" e ")}.\n\nEsempio: *"Croissant al cioccolato 95 THB breakfast"*`,
      incomplete: true,
    } as Partial<MenuItem> & { reply: string; incomplete: boolean };
  }

  const stories: Record<string,string> = {
    pizza: "Naturally leavened dough, fermented for 48 hours at 80% hydration with stone-milled Italian flours.\nBaked in a wood-fired oven at 450°C for exactly 90 seconds: tall airy crust, crispy base.\nSan Marzano DOP tomatoes from Campania, Agerola fior di latte mozzarella, basil torn by hand at service.\nEvery bite takes you to Naples — this isn't food, it's memory.",
    pasta: "Fresh pasta rolled by hand every morning with Sicilian durum semolina and free-range eggs.\nWorked with a rolling pin, cut with a knife, air-dried on wooden frames just like grandma did.\nThe sauce simmers slow — at least 4 hours — because time is the one ingredient you cannot buy.\nA dish that tells the patience of real Italian cooking.",
    starter: "A journey into Mediterranean flavors, opening dinner the way it should be opened: unhurried.\nSeasonal ingredients sourced from local growers and our direct imports from Italy.\nElegant plating, clean flavors, the perfect portion to wake up the appetite.\nThe beginning of a story you'll want to continue.",
    breakfast: "Italian breakfast is a ritual: strong coffee, warm pastry, slow conversation.\nWe prepare every morning with fresh ingredients, organic flours, seasonal market fruit.\nNo rush, no noise — just the taste of home, far from home.\nThe perfect start to the day, in our Bangkok-Italian way.",
    cocktails: "Crafted by our head bartender with selected Italian spirits and fresh ingredients.\nEach cocktail tells a region: from the Venetian Bellini to the Florentine Negroni, all the way to our signatures created in Bangkok.\nHand-carved ice, Sicilian citrus, aromatic herbs from our garden.\nOne sip, and you're in Italy.",
    dessert: "A family recipe passed down through three generations, still prepared by hand in our kitchen.\nPremium ingredients: 70% dark chocolate, fresh mascarpone, seasonal fruit.\nNo additives, no shortcuts — only time, dedication, and real ingredients.\nThe sweet finale of your Padella evening.",
    main: "The main course that tells the soul of Italian cooking: technique, raw material, respect.\nMeats selected from Italian farms, fresh fish of the day, seasonal vegetables.\nSlow cooking, careful plating, clean flavors — no unnecessary frills.\nA protagonist that stays in your memory.",
    panini: "Artisan bread kneaded in the morning with sourdough starter and baked in our oven.\nItalian fillings: San Daniele prosciutto, Campanian buffalo mozzarella, organic tomatoes.\nGrilled on a press for a few minutes — warm, fragrant, perfect for lunch or a snack.\nThe simplicity of the Italian table, in a fast and high-quality format.",
    salad: "Salads composed with fresh vegetables of the day and top-quality Italian ingredients.\nDOP extra virgin olive oil, IGP Modena balsamic vinegar, Cervia sea salt.\nA balanced mix of crunch, sweetness, salt and umami — the dish for those who want lightness with flavor.\nFresh, generous, Italian.",
    snack: "Small bites designed to accompany an aperitivo or a quiet pause.\nSelected ingredients, artisan preparation, careful presentation.\nPerfect to share with friends at the table, in front of a glass of wine.\nThe Italian culture of the snack, done the right way.",
    coffee: "100% arabica blend, roasted exclusively for us by a small Trieste roastery.\nExtracted with a professional machine at 9 bar, 92°C — the golden rule of Italian coffee.\nDense hazelnut-colored crema, intense aroma, round and persistent taste.\nA short but deep ritual, the way only Italians know how.",
    smoothies: "Fresh market fruit, blended on the spot with no added sugar or preservatives.\nBlends designed for taste and wellness: sweet, energetic, vitamin-packed.\nServed cold in tall glasses with careful garnish — perfect for Bangkok's heat.\nPure nature, Padella style.",
    fusion: "A creative dialogue between Italian tradition and top-quality Asian ingredients.\nOur chef respects both cultures without compromise, creating dishes that are one of a kind.\nPerfect for those who want Italian cuisine that also speaks Thai, Japanese, Vietnamese.\nThoughtful experimentation, surprising taste.",
    beer: "A selection of artisan Italian beers imported directly from breweries in Lombardy, Piedmont and Lazio.\nVaried styles: hoppy IPAs, crisp Lagers, intense Stouts, spiced Belgian Ales.\nServed at the right temperature in the right glass — details make the difference.\nItalian beer is a discovery worth making.",
    "soft-drinks": "Italian non-alcoholic drinks and fresh beverages prepared in-house.\nChinotto, Lemonade, Sicilian Orangeade, plus cold teas and natural infusions.\nNo industrial drinks — only authentic quality.\nThe perfect thirst quenchers for Bangkok's climate, with the taste of Italy.",
    "daily-special": "The daily special changes every 24 hours, inspired by seasonality and market availability.\nIt's the dish where our chef expresses himself freely, outside the regular menu.\nLimited edition — when it's gone, it's gone.\nFor those who want to discover something unique every time they come back.",
  };

  return {
    name,
    category,
    price,
    description: `${name} — crafted with selected Italian ingredients`,
    story: stories[category] ?? "A dish that tells the heart of Italy, prepared with care in our kitchen.\nIngredients selected directly from the finest Italian and local producers.\nTradition, quality and passion in every bite — as real cooking demands.\nAn authentic experience, in the heart of Bangkok.",
    tags: [category, "nuovo"],
    img: pendingImg,
    reply: `✅ **${name}** pronto!\n\n📂 Categoria: **${MENU_CATEGORIES.find(c=>c.id===category)?.label ?? category}** ${CATEGORY_EMOJI[category]}\n💰 Prezzo: **${price} THB**\n\nHo applicato il filtro brand alla foto. Vuoi modificare qualcosa o **confermare l'aggiunta al menu**?`,
  };
}

const INITIAL_MSG: Msg = {
  id: 0, role: "ai",
  text: "Ciao! Sono il tuo assistente per creare nuovi piatti.\n\n**Come funziona:**\n1. Carica una foto del piatto 📷\n2. Scrivi nome, prezzo e categoria\n3. Applico il filtro brand automaticamente\n4. Confermi e il piatto entra nel menu\n\nInizia caricando una foto o scrivendo un comando.",
};

const STORAGE_KEY = "padella_menu_ai_chat";
const ITEMS_KEY = "padella_menu_ai_items";

export default function AdminMenuAIPage() {
  const [msgs, setMsgs] = useState<Msg[]>([INITIAL_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingImg, setPendingImg] = useState<string | null>(null);
  const [pendingProcessed, setPendingProcessed] = useState<string | null>(null);
  const [processingImg, setProcessingImg] = useState(false);
  const [pendingItem, setPendingItem] = useState<Partial<MenuItem> | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load chat history + items from localStorage on mount
  useEffect(() => {
    try {
      const savedMsgs = localStorage.getItem(STORAGE_KEY);
      const savedItems = localStorage.getItem(ITEMS_KEY);
      if (savedMsgs) setMsgs(JSON.parse(savedMsgs));
      if (savedItems) setMenuItems(JSON.parse(savedItems));
    } catch (e) { console.warn("Errore caricamento storico:", e); }
    setHydrated(true);
  }, []);

  // Persist chat history — STRIPPING base64 images (troppo grandi per localStorage)
  // e tenendo solo gli ultimi 80 messaggi
  useEffect(() => {
    if (!hydrated) return;
    try {
      const lean = msgs.slice(-80).map(m => {
        // Rimuovo img base64 dal messaggio e dalla card (preservo solo path /images/)
        const stripped: Msg = { ...m };
        if (stripped.img && stripped.img.startsWith("data:")) stripped.img = undefined;
        if (stripped.card?.img && stripped.card.img.startsWith("data:")) {
          stripped.card = { ...stripped.card, img: null };
        }
        return stripped;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lean));
    } catch (e) {
      console.warn("Errore salvataggio storico:", e);
      // Quota? Tenta con solo gli ultimi 20 messaggi text-only
      try {
        const minimal = msgs.slice(-20).map(m => ({ id: m.id, role: m.role, text: m.text }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
      } catch {}
    }
  }, [msgs, hydrated]);

  // Pulisci eventuali residui dei piatti salvati in vecchie versioni (ora la fonte è Supabase)
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.removeItem(ITEMS_KEY); } catch {}
  }, [hydrated]);

  const clearHistory = () => {
    setMsgs([INITIAL_MSG]);
    setPendingImg(null); setPendingProcessed(null); setPendingItem(null);
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    });
    return () => cancelAnimationFrame(id);
  }, [msgs.length]);

  const onFile = useCallback(async (f: File) => {
    const userMsgId = Date.now();
    const loadingMsgId = userMsgId + 1;
    const sizeKB = Math.round(f.size / 1024);

    // 1. Subito: messaggio utente + bubble di loading allo stage "reading"
    setProcessingImg(true);
    setMsgs(prev => [...prev,
      { id: userMsgId, role: "user", text: `📷 ${f.name} (${sizeKB} KB)` },
      { id: loadingMsgId, role: "ai", text: "Caricamento foto in corso...", uploadStage: "reading", uploadProgress: 0 },
    ]);

    // 2. Lettura file con progress reale
    const reader = new FileReader();
    reader.onprogress = ev => {
      if (!ev.lengthComputable) return;
      const pct = Math.round((ev.loaded / ev.total) * 100);
      setMsgs(prev => prev.map(m => m.id === loadingMsgId ? { ...m, uploadProgress: pct } : m));
    };
    reader.onerror = () => {
      setMsgs(prev => prev.map(m => m.id === loadingMsgId
        ? { ...m, uploadStage: "error", text: "Errore nella lettura del file." } : m));
      setProcessingImg(false);
    };
    reader.onload = async e => {
      const raw = e.target!.result as string;
      setPendingImg(raw);

      // Allega l'immagine al messaggio utente + passa allo stage "filtering"
      setMsgs(prev => prev.map(m => {
        if (m.id === userMsgId) return { ...m, img: raw };
        if (m.id === loadingMsgId) return { ...m, uploadStage: "filtering", uploadProgress: 0 };
        return m;
      }));

      // Progress simulato durante il filter (canvas non emette eventi)
      const progressTimer = setInterval(() => {
        setMsgs(prev => prev.map(m =>
          m.id === loadingMsgId && (m.uploadProgress ?? 0) < 90
            ? { ...m, uploadProgress: (m.uploadProgress ?? 0) + 10 }
            : m
        ));
      }, 150);

      try {
        const processed = await applyBrandFilter(raw);
        clearInterval(progressTimer);
        setPendingProcessed(processed);
        setMsgs(prev => prev.map(m => m.id === loadingMsgId
          ? { ...m, uploadStage: "done", uploadProgress: 100,
              text: `✅ **Foto caricata!** Filtro classico applicato.\n\n✨ Sto chiamando **Nano Banana AI** per migliorare la foto preservando il piatto...` }
          : m
        ));

        // STEP 2: Background removal CLIENT-SIDE (preserva pixel originali) + compositing server
        const aiMsgId = Date.now() + 7;
        setMsgs(prev => [...prev, {
          id: aiMsgId, role: "ai",
          text: "Estraggo il piatto dalla foto originale (pixel-perfect)...",
          uploadStage: "filtering", uploadProgress: 20,
        }]);

        try {
          // Browser rimuove sfondo dai pixel ORIGINALI (no AI redraw)
          setMsgs(prev => prev.map(m => m.id === aiMsgId ? { ...m, uploadProgress: 40 } : m));
          const dishPng = await removeBackgroundClient(raw);
          setMsgs(prev => prev.map(m => m.id === aiMsgId ? { ...m, uploadProgress: 70 } : m));

          // Server composita il piatto trasparente su template brand
          const aiRes = await fetch("/api/enhance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: dishPng, mimeType: "image/png" }),
          });
          const aiData = await aiRes.json();
          if (!aiRes.ok || !aiData.imageDataUrl) throw new Error(aiData.error || "Errore compositing");

          // Sostituisco pendingProcessed con la versione AI (usata poi per il salvataggio)
          setPendingProcessed(aiData.imageDataUrl);
          setMsgs(prev => prev.map(m => m.id === aiMsgId ? {
            ...m, uploadStage: "done", uploadProgress: 100,
            text: `🎨 **Nano Banana ha migliorato la foto!**\n\nLuce calda, sfondo elegante, dettagli pro.\n\n🔍 Sto analizzando il piatto per riconoscerlo...`,
            img: aiData.imageDataUrl,
          } : m));

          // STEP 3: detect dish category + name + ingredients via Gemini Vision
          try {
            const detectRes = await fetch("/api/detect-dish", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageBase64: aiData.imageDataUrl, mimeType: "image/jpeg" }),
            });
            const det = await detectRes.json();
            if (detectRes.ok && det.category) {
              // Pre-popola il pending item con i suggerimenti
              setPendingItem({
                category: det.category,
                name: det.suggested_name || "",
                description: det.visible_ingredients || "",
                img: aiData.imageDataUrl,
              });
              const confEmoji = det.confidence === "high" ? "🟢" : det.confidence === "medium" ? "🟡" : "🟠";
              setMsgs(prev => [...prev, {
                id: Date.now() + 8, role: "ai",
                text: `${confEmoji} **Ho riconosciuto il piatto:**\n\n• **Categoria**: ${det.category}\n• **Nome suggerito**: ${det.suggested_name || "—"}\n• **Ingredienti visibili**: ${det.visible_ingredients || "—"}\n• **Confidenza**: ${det.confidence}\n\nSe ti va bene, scrivi il **prezzo** (es. "320 THB") e confermo.\nAltrimenti correggi: *"nome Pizza Margherita"*, *"categoria pizza"*, ecc.`,
              }]);
            }
          } catch (detErr) {
            console.warn("Detect dish failed:", detErr);
            setMsgs(prev => [...prev, {
              id: Date.now() + 8, role: "ai",
              text: "Non sono riuscito a riconoscere il piatto in automatico. Scrivi tu nome, prezzo, categoria.\nEsempio: *\"Pizza Margherita 280 THB pizza\"*",
            }]);
          }
        } catch (aiErr) {
          console.error("AI enhance failed:", aiErr);
          setMsgs(prev => prev.map(m => m.id === aiMsgId ? {
            ...m, uploadStage: "error",
            text: `⚠️ AI non disponibile (uso il filtro classico).\nDettaglio: ${aiErr instanceof Error ? aiErr.message : "unknown"}`,
          } : m));
          // pendingProcessed resta la versione canvas — funziona comunque
        }
      } catch {
        clearInterval(progressTimer);
        setMsgs(prev => prev.map(m => m.id === loadingMsgId
          ? { ...m, uploadStage: "error", text: "⚠️ Errore nell'applicazione del filtro. Riprova." }
          : m
        ));
      } finally {
        setProcessingImg(false);
      }
    };
    reader.readAsDataURL(f);
  }, []);

  const send = async (text?: string) => {
    const val = (text ?? input).trim();
    if (!val || loading) return;
    setInput("");
    setMsgs(prev => [...prev, { id: Date.now(), role: "user", text: val }]);
    setLoading(true);

    // === PARSING INTELLIGENTE con Gemini ===
    let intent: string = "unclear";
    let parsedFields: { name?: string|null; category?: string|null; price?: number|null; description?: string|null; missing?: string[]; explanation?: string } = {};
    try {
      const parseRes = await fetch("/api/parse-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: val,
          pending: pendingItem ? {
            name: pendingItem.name, category: pendingItem.category,
            description: pendingItem.description, price: pendingItem.price,
          } : null,
        }),
      });
      const j = await parseRes.json();
      if (parseRes.ok) {
        intent = j.intent ?? "unclear";
        parsedFields = j;
      }
    } catch (e) {
      console.warn("parse-menu failed:", e);
    }

    // Confirm add
    if (pendingItem && intent === "confirm") {
      const photo = pendingProcessed ?? pendingItem.img ?? null;
      const name = pendingItem.name ?? "Piatto";
      const price = pendingItem.price ?? 0;
      const category = pendingItem.category ?? "starter";

      // Validation
      if (!pendingItem.name || !pendingItem.category || !pendingItem.price) {
        const missing: string[] = [];
        if (!pendingItem.name) missing.push("**nome**");
        if (!pendingItem.category) missing.push("**categoria**");
        if (!pendingItem.price) missing.push("**prezzo**");
        setMsgs(prev => [...prev, { id: Date.now(), role: "ai",
          text: `⚠️ Manca ancora: ${missing.join(", ")}. Aggiungili prima di confermare.` }]);
        setLoading(false); return;
      }

      // Messaggio "salvataggio su Firebase..."
      const savingMsgId = Date.now();
      setMsgs(prev => [...prev, {
        id: savingMsgId, role: "ai",
        text: "Salvataggio su Firebase in corso...",
        uploadStage: "filtering", uploadProgress: 30,
      }]);

      try {
        const remoteId = await addMenuItem({
          name, price, category,
          description: pendingItem.description ?? "",
          story: pendingItem.story ?? "",
          tags: pendingItem.tags ?? [],
          photoDataUrl: photo,
        });
        const item: MenuItem = {
          id: remoteId, name, description: pendingItem.description ?? "",
          price, category, story: pendingItem.story ?? "",
          img: photo, tags: pendingItem.tags ?? [],
        };
        setMenuItems(prev => [...prev, item]);
        setPendingItem(null); setPendingImg(null); setPendingProcessed(null);
        setMsgs(prev => prev.map(m => m.id === savingMsgId ? {
          ...m, uploadStage: "done", uploadProgress: 100,
          text: `🎉 **${name}** salvato su Firebase!\n\nPrezzo: ${price} THB · Categoria: ${MENU_CATEGORIES.find(c=>c.id===category)?.label}\n\nÈ visibile in tempo reale su tutti i dispositivi.`,
          card: item,
        } : m));
      } catch (err) {
        console.error("Errore Firebase:", err);
        setMsgs(prev => prev.map(m => m.id === savingMsgId ? {
          ...m, uploadStage: "error",
          text: `⚠️ Errore nel salvataggio: ${err instanceof Error ? err.message : "controlla la connessione"}.`,
        } : m));
      }
      setLoading(false); return;
    }

    // === ADD o MODIFY: usa i campi estratti da Gemini ===
    if (intent === "add" || intent === "modify") {
      // Merge: parte da pendingItem (o vuoto) + sovrascrive con i campi nuovi
      const merged: Partial<MenuItem> = {
        ...(pendingItem ?? {}),
        ...(parsedFields.name ? { name: parsedFields.name } : {}),
        ...(parsedFields.category ? { category: parsedFields.category } : {}),
        ...(parsedFields.price ? { price: parsedFields.price } : {}),
        ...(parsedFields.description ? { description: parsedFields.description } : {}),
        img: pendingProcessed ?? pendingImg ?? pendingItem?.img ?? null,
      };
      setPendingItem(merged);

      // Costruisci anteprima
      const lines: string[] = [];
      lines.push("📋 **Anteprima — verifica prima di confermare:**\n");
      lines.push(`• **Nome**: ${merged.name ?? "—"}`);
      lines.push(`• **Categoria**: ${merged.category ?? "—"}`);
      lines.push(`• **Prezzo**: ${merged.price ? merged.price + " THB" : "—"}`);
      lines.push(`• **Descrizione**: ${merged.description ?? "—"}`);

      const missing: string[] = [];
      if (!merged.name) missing.push("nome");
      if (!merged.category) missing.push("categoria");
      if (!merged.price) missing.push("prezzo");

      if (missing.length > 0) {
        lines.push(`\n⚠️ Mancano: **${missing.join(", ")}**. Aggiungili e poi conferma.`);
      } else {
        lines.push(`\n✅ Tutti i campi sono compilati. Rispondi **"sì"** per salvare, o correggi qualcosa.`);
      }

      const card = merged.name && merged.category && merged.price
        ? { ...merged, id: "preview", story: "", tags: [] } as MenuItem
        : undefined;

      setMsgs(prev => [...prev, { id: Date.now(), role: "ai", text: lines.join("\n"), ...(card ? { card } : {}) }]);
      setLoading(false); return;
    }

    // === CANCEL ===
    if (intent === "cancel" && pendingItem) {
      setPendingItem(null); setPendingImg(null); setPendingProcessed(null);
      setMsgs(prev => [...prev, { id: Date.now(), role: "ai",
        text: "❎ Annullato. Carica un'altra foto o riparti da capo." }]);
      setLoading(false); return;
    }

    setMsgs(prev => [...prev, { id: Date.now(), role: "ai", text: "Carica una foto e poi scrivi il nome del piatto con prezzo e categoria.\n\nEsempio: *\"Spaghetti alle Vongole 360 THB pasta\"*" }]);
    setLoading(false);
  };

  return (
    <div className="bg-[#0c1710] flex flex-col md:flex-row" style={{ height: "100dvh" }}>

      {/* ── LEFT: Added dishes list — hidden on mobile ── */}
      <div className="hidden md:flex md:w-72 bg-[#111d16] border-r border-padella-cream/5 flex-col">
        <div className="px-5 py-4 border-b border-padella-cream/5">
          <div className="flex items-center gap-2">
            <ChefHat size={15} className="text-padella-gold" />
            <span className="text-padella-cream font-semibold text-sm">Piatti aggiunti</span>
            {menuItems.length > 0 && (
              <span className="ml-auto w-5 h-5 rounded-full bg-padella-gold text-padella-green text-[10px] font-bold flex items-center justify-center">{menuItems.length}</span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2 opacity-30">🍽️</div>
              <p className="text-padella-cream/25 text-xs">Nessun piatto aggiunto ancora</p>
            </div>
          ) : (
            menuItems.map(item => (
              <div key={item.id} className="bg-[#1a2e1f] border border-padella-cream/8 rounded-xl overflow-hidden">
                {item.img && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.img} alt={item.name} className="w-full h-24 object-cover" />
                )}
                <div className="p-3">
                  <div className="text-padella-cream/80 text-xs font-semibold">{item.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-padella-cream/30 text-[10px]">{CATEGORY_EMOJI[item.category]} {item.category}</span>
                    <span className="text-padella-gold text-xs font-bold">{item.price} THB</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {menuItems.length > 0 && (
          <div className="p-4 border-t border-padella-cream/5">
            <button className="w-full py-2.5 bg-padella-gold text-padella-green rounded-xl text-sm font-semibold hover:bg-padella-gold/90 transition-all">
              Pubblica {menuItems.length} piatt{menuItems.length === 1 ? "o" : "i"}
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT: Chat ── */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Chat header */}
        <div className="px-5 py-4 border-b border-padella-cream/5 bg-[#111d16] flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-padella-gold/15 border border-padella-gold/20 flex items-center justify-center">
            <Sparkles size={15} className="text-padella-gold" />
          </div>
          <div>
            <div className="text-padella-cream text-sm font-semibold">Create Menu AI</div>
            <div className="text-padella-cream/30 text-[10px]">Upload photo · Describe dish · Publish</div>
          </div>
          {processingImg && (
            <div className="ml-auto flex items-center gap-2 text-padella-gold/70 text-xs">
              <Wand2 size={12} className="animate-pulse" /> Applico filtro brand...
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <AnimatePresence initial={false}>
            {msgs.map(msg => (
              <motion.div key={msg.id} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.28 }}
                className={`flex gap-3 ${msg.role==="user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-bold ${msg.role==="ai" ? "bg-padella-gold/20 border border-padella-gold/20" : "bg-padella-green/80 border border-padella-cream/10"}`}>
                  {msg.role==="ai" ? <Sparkles size={12} className="text-padella-gold" /> : "Tu"}
                </div>
                <div className={`max-w-[80%] space-y-2 ${msg.role==="user" ? "items-end" : "items-start"} flex flex-col`}>
                  {/* Image preview */}
                  {msg.img && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={msg.img} alt="upload" className="rounded-xl max-w-[200px] object-cover border border-padella-cream/10" />
                  )}
                  {/* Upload progress card (when stage is active and not done) */}
                  {msg.uploadStage && msg.uploadStage !== "done" && msg.uploadStage !== "error" && (
                    <div className="bg-[#1a2e1f] border border-padella-gold/20 rounded-2xl rounded-tl-sm px-4 py-3 min-w-[240px]">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 size={13} className="text-padella-gold animate-spin" />
                        <span className="text-padella-cream/80 text-xs font-semibold">
                          {msg.uploadStage === "reading" ? "Lettura file..." : "Applico filtro brand..."}
                        </span>
                        <span className="ml-auto text-padella-gold text-xs font-bold tabular-nums">{msg.uploadProgress ?? 0}%</span>
                      </div>
                      <div className="h-1.5 bg-padella-cream/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-padella-gold rounded-full"
                          animate={{ width: `${msg.uploadProgress ?? 0}%` }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>
                      <div className="text-padella-cream/35 text-[10px] mt-2 flex items-center gap-1.5">
                        <span className={msg.uploadStage === "reading" ? "text-padella-gold" : "text-padella-cream/50"}>1. Lettura</span>
                        <span>→</span>
                        <span className={msg.uploadStage === "filtering" ? "text-padella-gold" : "text-padella-cream/30"}>2. Filtro</span>
                        <span>→</span>
                        <span className="text-padella-cream/20">3. Pronto</span>
                      </div>
                    </div>
                  )}

                  {/* Text bubble — solo se non è un progress in corso */}
                  {(!msg.uploadStage || msg.uploadStage === "done" || msg.uploadStage === "error") && (
                    <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role==="user"
                        ? "bg-padella-gold/90 text-padella-green font-medium rounded-tr-sm"
                        : msg.uploadStage === "error"
                          ? "bg-red-500/10 border border-red-500/20 text-red-300 rounded-tl-sm"
                          : "bg-[#1a2e1f] border border-padella-cream/8 text-padella-cream/80 rounded-tl-sm"
                    }`}>
                      {msg.text.split("\n").map((line, i) => {
                        const html = line.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\*(.*?)\*/g,"<em>$1</em>");
                        return <p key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }} />;
                      })}
                    </div>
                  )}
                  {/* Card preview when item parsed */}
                  {msg.card && msg.card.img && (
                    <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }}
                      className="bg-[#0f1a14] border border-padella-gold/20 rounded-xl overflow-hidden max-w-[220px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={msg.card.img} alt={msg.card.name} className="w-full h-32 object-cover" />
                      <div className="p-3">
                        <div className="text-padella-gold/50 text-[9px] uppercase tracking-wide">{CATEGORY_EMOJI[msg.card.category!]} {msg.card.category}</div>
                        <div className="text-padella-cream text-sm font-semibold mt-0.5">{msg.card.name}</div>
                        <div className="text-padella-gold text-sm font-bold mt-1">{msg.card.price} THB</div>
                        <button
                          onClick={() => send("sì")}
                          className="w-full mt-2 py-1.5 bg-padella-gold text-padella-green rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-padella-gold/90 transition-all">
                          <Check size={11} /> Conferma & Aggiungi
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-padella-gold/20 border border-padella-gold/20 flex items-center justify-center">
                <Sparkles size={12} className="text-padella-gold" />
              </div>
              <div className="bg-[#1a2e1f] border border-padella-cream/8 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                {[0,1,2].map(i => (
                  <motion.div key={i} animate={{ y:[0,-4,0] }} transition={{ duration:0.6,delay:i*0.15,repeat:Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-padella-gold/50" />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 pb-4 pt-2 border-t border-padella-cream/5 flex-shrink-0">
          {/* Pending image strip */}
          {pendingProcessed && (
            <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }}
              className="flex items-center gap-3 mb-3 p-2 bg-padella-gold/5 border border-padella-gold/15 rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pendingProcessed} alt="preview" className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="text-padella-gold text-xs font-semibold">Foto pronta ✨</div>
                <div className="text-padella-cream/30 text-[10px]">Filtro brand applicato — descrivi il piatto</div>
              </div>
              <button onClick={() => { setPendingImg(null); setPendingProcessed(null); }}
                className="text-padella-cream/30 hover:text-padella-cream/60">
                <X size={14} />
              </button>
            </motion.div>
          )}

          {/* Pulsante carica foto — grande e visibile */}
          {!pendingImg && (
            <label htmlFor="menu-photo-upload"
              className="flex items-center justify-center gap-2 w-full mb-2 py-3 rounded-2xl bg-padella-gold/15 hover:bg-padella-gold/25 border-2 border-dashed border-padella-gold/40 text-padella-gold font-semibold text-sm cursor-pointer active:scale-[0.99] transition-all">
              <ImagePlus size={18} />
              Carica foto del piatto
            </label>
          )}
          <input id="menu-photo-upload" type="file" accept="image/*" className="hidden"
            onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); e.target.value=""; }} />

          <div className="flex gap-2 bg-[#1a2e1f] border border-padella-cream/10 rounded-2xl px-3 py-2">
            {/* Icona piccola sempre disponibile (anche dopo upload) */}
            <label htmlFor="menu-photo-upload"
              className="w-11 h-11 rounded-xl bg-padella-cream/5 hover:bg-padella-gold/15 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer active:bg-padella-gold/20"
              title="Carica un'altra foto">
              <ImagePlus size={16} className="text-padella-gold" />
            </label>

            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==="Enter" && send()}
              placeholder={pendingImg ? "Es: Pizza Margherita 280 THB" : "Scrivi nome, prezzo, categoria..."}
              className="flex-1 bg-transparent text-padella-cream placeholder-padella-cream/25 text-sm outline-none min-h-[44px]"
            />
            <button
              type="button"
              onPointerDown={e => e.preventDefault()}
              onClick={() => send()}
              disabled={loading}
              className="w-11 h-11 rounded-full bg-padella-gold flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0 active:scale-95"
              style={{ touchAction: "manipulation" }}>
              {loading ? <Loader2 size={13} className="text-padella-green animate-spin" /> : <Send size={13} className="text-padella-green" />}
            </button>
          </div>
          <p className="text-center text-padella-cream/15 text-[10px] mt-1.5">📷 Carica foto → scrivi dettagli → il piatto entra nel menu</p>
        </div>
      </div>
    </div>
  );
}
