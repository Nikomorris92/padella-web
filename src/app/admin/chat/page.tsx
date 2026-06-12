"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, ChefHat, BarChart2, Calendar, QrCode, Mic, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const CHAT_STORAGE_KEY = "padella_admin_chat";

const INITIAL_CHAT: Message = {
  id: 0, role: "assistant", timestamp: new Date(),
  text: "Ciao! 👋 Sono l'assistente AI di Padella Bangkok — alimentato da Gemini con accesso diretto al database.\n\nPosso DAVVERO modificare il sito:\n• **Menu**: aggiungere/modificare/eliminare piatti, cambiare prezzi, nascondere piatti dal menu\n• **Contatti & info**: WhatsApp, LINE, indirizzo, orari, tagline home\n• **Tema grafico**: cambiare il colore oro o verde del brand\n• **Sezioni homepage**: nascondere/mostrare Padel, Pool, Events, Gallery, Community\n\nDimmi quello che vuoi fare in italiano o inglese — capisco entrambi.",
};

type Role = "user" | "assistant";
interface Message { id: number; role: Role; text: string; action?: string; timestamp: Date; }

const SUGGESTIONS = [
  "Mostrami tutti i piatti del menu",
  "Cambia il prezzo della Pizza Margherita a 300 THB",
  "Cambia il numero WhatsApp a +66 99 123 4567",
  "Nascondi la sezione community dalla home",
  "Cambia il colore oro in #D4B355",
  "Aggiorna la tagline della home a 'Italian Soul, Bangkok Vibes'",
];

function parseCommand(input: string): { reply: string; action?: string } {
  const low = input.toLowerCase();

  // ADD dish
  if (low.includes("aggiungi") || low.includes("add") || low.includes("nuovo piatto") || low.includes("inserisci")) {
    const priceMatch = input.match(/(\d{2,4})\s*(thb|baht|฿)?/i);
    const price = priceMatch ? priceMatch[1] : "???";
    const nameMatch = input.replace(/aggiungi|add|inserisci|nuovo piatto/gi, "").replace(/\d+\s*(thb|baht|฿)/gi, "").trim();
    return {
      reply: `✅ **Piatto aggiunto al menu!**\n\n**Nome:** ${nameMatch || "Nuovo piatto"}\n**Prezzo:** ${price} THB\n**Categoria:** rilevata automaticamente\n\nIl piatto è ora visibile nel menu. Vuoi aggiungere una foto o una storia?`,
      action: "add_dish",
    };
  }

  // DAILY SPECIAL
  if (low.includes("menu del giorno") || low.includes("speciale") || low.includes("daily") || low.includes("piatto del giorno")) {
    const priceMatch = input.match(/(\d{2,4})\s*(thb|baht|฿)?/i);
    const price = priceMatch ? priceMatch[1] : null;
    const nameMatch = input.replace(/menu del giorno|piatto del giorno|speciale|daily/gi, "").replace(/\d+\s*(thb|baht|฿)/gi, "").replace(/[:\-]/g, "").trim();
    return {
      reply: `📅 **Menu del Giorno aggiornato!**\n\n**Piatto:** ${nameMatch || "Speciale del giorno"}\n**Prezzo:** ${price ? price + " THB" : "da definire"}\n**Visibile:** ora sul sito e nel QR menu\n\nI clienti vedranno questo piatto in evidenza nella sezione "Speciale" del menu.`,
      action: "daily_special",
    };
  }

  // DISABLE/REMOVE
  if (low.includes("disabilita") || low.includes("rimuovi") || low.includes("nascondi") || low.includes("disable")) {
    const item = input.replace(/disabilita|rimuovi|nascondi|disable/gi, "").replace(/oggi|dal menu/gi, "").trim();
    return {
      reply: `🔴 **${item}** nascosto dal menu.\n\nIl piatto non è più visibile ai clienti. Puoi riabilitarlo in qualsiasi momento dal Menu Manager o scrivendo "riabilita ${item}".`,
      action: "disable_dish",
    };
  }

  // ENABLE
  if (low.includes("riabilita") || low.includes("abilita") || low.includes("mostra")) {
    const item = input.replace(/riabilita|abilita|mostra/gi, "").trim();
    return {
      reply: `🟢 **${item}** è di nuovo visibile nel menu!`,
      action: "enable_dish",
    };
  }

  // STATS
  if (low.includes("statistic") || low.includes("views") || low.includes("visite") || low.includes("quante") || low.includes("analytics")) {
    return {
      reply: `📊 **Statistiche questa settimana:**\n\n• 👁️ Page views: **12,847** (+18%)\n• 👤 Sessioni: **4,231** (+12%)\n• 💬 Click WhatsApp: **342** (+24%)\n• 📱 Scansioni QR: **1,456** (+31%)\n\n**Top piatti:**\n1. Tagliatelle al Ragù — 847 views\n2. Pizza Tartufata — 723 views\n3. Burrata Pugliese — 698 views`,
      action: "show_stats",
    };
  }

  // QR CODE
  if (low.includes("qr") || low.includes("codice qr")) {
    return {
      reply: `📲 **QR Code generato!**\n\nHo creato 4 QR codes:\n• **Menu digitale** — per i tavoli\n• **Google Review** — per raccogliere recensioni\n• **WhatsApp** — contatto diretto\n• **Prenotazione** — reserva un tavolo\n\nVai alla sezione QR Codes per scaricarli in PDF.`,
      action: "qr_codes",
    };
  }

  // PRICE UPDATE
  if (low.includes("cambia prezzo") || low.includes("aggiorna prezzo") || low.includes("prezzo")) {
    return {
      reply: `💰 Per aggiornare un prezzo scrivi:\n*"Cambia prezzo [nome piatto] a [prezzo] THB"*\n\nEsempio: *"Cambia prezzo Tiramisù a 200 THB"*`,
    };
  }

  // OPENING HOURS
  if (low.includes("orario") || low.includes("aperto") || low.includes("chiuso") || low.includes("orari")) {
    return {
      reply: `🕐 **Orari Padella Bangkok:**\n\n• **Colazione:** 7:00 – 11:00\n• **Pranzo:** 11:00 – 15:00\n• **Aperitivo:** 18:00 – 20:00\n• **Cena:** 20:00 – 24:00\n\nVuoi modificare gli orari per oggi o per una data specifica?`,
    };
  }

  // RESERVATION
  if (low.includes("prenota") || low.includes("prenotazione") || low.includes("tavolo")) {
    return {
      reply: `📅 **Gestione prenotazioni:**\nAttualmente le prenotazioni arrivano via WhatsApp. Vuoi che attivi anche un sistema di prenotazione online con calendario? Posso configurarlo.`,
    };
  }

  // HELP
  if (low.includes("aiuto") || low.includes("help") || low.includes("cosa puoi fare") || low.includes("comandi")) {
    return {
      reply: `🤖 **Cosa posso fare:**\n\n**Menu:**\n• *"Aggiungi [piatto] [prezzo] THB"*\n• *"Disabilita [piatto]"*\n• *"Cambia prezzo [piatto] a [prezzo]"*\n\n**Menu del Giorno:**\n• *"Menu del giorno: [piatto] [prezzo]"*\n\n**Analytics:**\n• *"Mostrami le statistiche"*\n\n**QR:**\n• *"Crea QR code"*\n\n**Orari:**\n• *"Siamo aperti oggi?"*`,
    };
  }

  // FALLBACK
  return {
    reply: `Non ho capito bene la richiesta. Prova a scrivere:\n• *"Aggiungi [piatto] [prezzo] THB"*\n• *"Menu del giorno: [piatto]"*\n• *"Mostrami le statistiche"*\n\nOppure scrivi **"help"** per vedere tutti i comandi.`,
  };
}

function formatMessage(text: string) {
  return text.split("\n").map((line, i) => {
    const boldLine = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
    return <p key={i} className={`${line.startsWith("•") ? "pl-2" : ""} leading-relaxed`} dangerouslySetInnerHTML={{ __html: boldLine || "&nbsp;" }} />;
  });
}

export default function AdminChatPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_CHAT]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed: Message[] = JSON.parse(saved);
        // restore Date objects
        setMessages(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages, hydrated]);

  const clearHistory = () => setMessages([INITIAL_CHAT]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    });
    return () => cancelAnimationFrame(id);
  }, [messages.length]);

  const send = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || loading) return;
    setInput("");

    const userMsg: Message = { id: Date.now(), role: "user", text: value, timestamp: new Date() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const res = await fetch("/api/admin-ai-chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: newMsgs.filter(m => m.id !== 0).map(m => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");

      const toolsInfo = data.toolsExecuted?.length
        ? `\n\n*${data.toolsExecuted.length} azione/i eseguita/e: ${data.toolsExecuted.map((t: { name: string }) => t.name).join(", ")}*`
        : "";
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: "assistant",
        text: (data.reply || "(nessuna risposta)") + toolsInfo,
        timestamp: new Date(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: "assistant",
        text: `⚠️ Errore: ${err instanceof Error ? err.message : "sconosciuto"}`,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#0f1a14]" style={{ height: "100dvh" }}>

      {/* Header */}
      <div className="px-6 py-4 border-b border-padella-cream/5 bg-[#111d16] flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-padella-gold/15 border border-padella-gold/20 flex items-center justify-center">
          <Sparkles size={18} className="text-padella-gold" />
        </div>
        <div>
          <div className="text-padella-cream font-semibold text-sm">Assistente AI Padella</div>
          <div className="text-padella-cream/35 text-[11px]">Gestisci menu, statistiche e molto altro via chat</div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400/70 text-[11px]">Online</span>
          </div>
          <button
            type="button"
            onClick={() => { if (confirm("Cancellare tutto lo storico chat?")) clearHistory(); }}
            className="w-9 h-9 rounded-xl bg-padella-cream/5 hover:bg-red-500/15 flex items-center justify-center transition-colors active:scale-95"
            title="Cancella storico"
            style={{ touchAction: "manipulation" }}
          >
            <Trash2 size={14} className="text-padella-cream/40 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === "assistant" ? "bg-padella-gold/20 border border-padella-gold/20" : "bg-padella-green border border-padella-cream/10"
              }`}>
                {msg.role === "assistant"
                  ? <Sparkles size={13} className="text-padella-gold" />
                  : <span className="text-padella-cream text-xs font-bold">Tu</span>
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm space-y-0.5 ${
                msg.role === "assistant"
                  ? "bg-[#1a2e1f] border border-padella-cream/8 text-padella-cream/80 rounded-tl-sm"
                  : "bg-padella-gold/90 text-padella-green font-medium rounded-tr-sm"
              }`}>
                {msg.role === "assistant" ? formatMessage(msg.text) : <p>{msg.text}</p>}
                <p className={`text-[10px] mt-2 ${msg.role === "assistant" ? "text-padella-cream/20" : "text-padella-green/50"}`}>
                  {msg.timestamp.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-padella-gold/20 border border-padella-gold/20 flex items-center justify-center">
              <Sparkles size={13} className="text-padella-gold" />
            </div>
            <div className="bg-[#1a2e1f] border border-padella-cream/8 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-padella-gold/50" />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => send(s)}
              className="flex-shrink-0 px-3 py-2 bg-padella-cream/5 border border-padella-cream/10 rounded-full text-padella-cream/60 text-xs hover:bg-padella-cream/10 hover:text-padella-cream/80 transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-padella-cream/5 flex-shrink-0">
        <div className="flex gap-2 bg-[#1a2e1f] border border-padella-cream/10 rounded-2xl px-4 py-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Scrivi un comando... es: 'Aggiungi pizza funghi 280 THB'"
            className="flex-1 bg-transparent text-padella-cream placeholder-padella-cream/25 text-sm outline-none min-h-[44px]"
          />
          <button
            type="button"
            onPointerDown={e => e.preventDefault()}
            onClick={() => send()}
            disabled={loading}
            className="w-11 h-11 rounded-full bg-padella-gold flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0 active:scale-95"
            style={{ touchAction: "manipulation" }}
          >
            <Send size={14} className="text-padella-green" />
          </button>
        </div>
        <p className="text-center text-padella-cream/20 text-[10px] mt-2">Scrivi in italiano o inglese — il sistema capisce entrambi</p>
      </div>
    </div>
  );
}
