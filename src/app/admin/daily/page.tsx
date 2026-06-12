"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, X, Eye, EyeOff, Star, Clock, Trash2, Check } from "lucide-react";
import { MENU_CATEGORIES } from "@/lib/menuData";

interface DailyItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  active: boolean;
  timeSlot: "lunch" | "dinner" | "all";
}

const INITIAL: DailyItem[] = [
  { id: "d1", name: "Risotto ai Porcini", description: "Arborio rice with wild porcini, white wine, Parmigiano", price: 350, category: "pasta", active: true, timeSlot: "lunch" },
  { id: "d2", name: "Branzino al Limone", description: "Sea bass, lemon butter, capers, fresh herbs", price: 420, category: "main", active: true, timeSlot: "dinner" },
];

const TIME_OPTIONS = [
  { value: "lunch", label: "Pranzo", icon: "☀️", desc: "11:00 – 15:00" },
  { value: "dinner", label: "Cena", icon: "🌙", desc: "20:00 – 24:00" },
  { value: "all", label: "Tutto il giorno", icon: "🕐", desc: "7:00 – 24:00" },
];

const today = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

export default function AdminDailyPage() {
  const [items, setItems] = useState<DailyItem[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "pasta", timeSlot: "lunch" as DailyItem["timeSlot"] });

  const addItem = () => {
    if (!form.name || !form.price) return;
    setItems(prev => [...prev, { id: Date.now().toString(), name: form.name, description: form.description, price: Number(form.price), category: form.category, active: true, timeSlot: form.timeSlot }]);
    setForm({ name: "", description: "", price: "", category: "pasta", timeSlot: "lunch" });
    setShowForm(false);
  };

  const toggle = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i));
  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const publish = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0f1a14] p-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-padella-cream text-2xl md:text-3xl mb-1">Menu del Giorno</h1>
          <div className="flex items-center gap-2 text-padella-cream/40 text-sm">
            <Calendar size={14} />
            <span className="capitalize">{today}</span>
          </div>
        </div>
        <motion.button
          onClick={publish}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
            saved ? "bg-green-500 text-white" : "bg-padella-gold text-padella-green hover:bg-padella-gold/90"
          }`}
        >
          {saved ? <><Check size={15} /> Pubblicato!</> : "Pubblica Oggi"}
        </motion.button>
      </div>

      {/* Active count */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Piatti attivi", value: items.filter(i => i.active).length, color: "text-green-400" },
          { label: "Visibili ora", value: items.filter(i => i.active && i.timeSlot !== "dinner").length, color: "text-padella-gold" },
          { label: "Per stasera", value: items.filter(i => i.active && (i.timeSlot === "dinner" || i.timeSlot === "all")).length, color: "text-blue-400" },
        ].map(s => (
          <div key={s.label} className="bg-[#1a2e1f] border border-padella-cream/8 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
            <div className="text-padella-cream/35 text-[11px] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-3 mb-6">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`bg-[#1a2e1f] border rounded-xl p-4 flex items-start gap-4 transition-all ${
                item.active ? "border-padella-cream/10" : "border-padella-cream/4 opacity-50"
              }`}
            >
              {/* Star */}
              <div className="w-10 h-10 rounded-lg bg-padella-gold/10 flex items-center justify-center flex-shrink-0">
                <Star size={16} className="text-padella-gold" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-padella-cream font-semibold text-sm">{item.name}</span>
                  <span className="text-padella-gold text-xs font-bold">{item.price} THB</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    item.timeSlot === "lunch" ? "bg-yellow-500/15 text-yellow-400" :
                    item.timeSlot === "dinner" ? "bg-blue-500/15 text-blue-400" :
                    "bg-padella-cream/10 text-padella-cream/50"
                  }`}>
                    {TIME_OPTIONS.find(t => t.value === item.timeSlot)?.icon} {TIME_OPTIONS.find(t => t.value === item.timeSlot)?.label}
                  </span>
                </div>
                <p className="text-padella-cream/40 text-xs mt-1 line-clamp-1">{item.description}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggle(item.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.active ? "bg-green-500/20 text-green-400" : "bg-padella-cream/5 text-padella-cream/30"}`}>
                  {item.active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => remove(item.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400/60 hover:text-red-400 flex items-center justify-center transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="bg-[#1a2e1f] border border-padella-gold/20 rounded-xl p-5 mb-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-padella-gold font-semibold text-sm">Nuovo Speciale</span>
              <button onClick={() => setShowForm(false)}><X size={16} className="text-padella-cream/40" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome del piatto *"
                className="px-4 py-2.5 bg-[#0f1a14] border border-padella-cream/10 rounded-lg text-padella-cream text-sm placeholder-padella-cream/25 outline-none focus:border-padella-gold/40" />
              <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} type="number"
                placeholder="Prezzo THB *"
                className="px-4 py-2.5 bg-[#0f1a14] border border-padella-cream/10 rounded-lg text-padella-cream text-sm placeholder-padella-cream/25 outline-none focus:border-padella-gold/40" />
            </div>

            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descrizione breve"
              className="w-full px-4 py-2.5 bg-[#0f1a14] border border-padella-cream/10 rounded-lg text-padella-cream text-sm placeholder-padella-cream/25 outline-none focus:border-padella-gold/40" />

            <div className="grid grid-cols-2 gap-3">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="px-4 py-2.5 bg-[#0f1a14] border border-padella-cream/10 rounded-lg text-padella-cream text-sm outline-none">
                {MENU_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
              </select>
              <select value={form.timeSlot} onChange={e => setForm(f => ({ ...f, timeSlot: e.target.value as DailyItem["timeSlot"] }))}
                className="px-4 py-2.5 bg-[#0f1a14] border border-padella-cream/10 rounded-lg text-padella-cream text-sm outline-none">
                {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label} — {t.desc}</option>)}
              </select>
            </div>

            <button onClick={addItem} className="w-full py-2.5 bg-padella-gold text-padella-green font-semibold rounded-lg text-sm hover:bg-padella-gold/90 transition-all">
              Aggiungi al Menu del Giorno
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add button */}
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="w-full py-3 border border-dashed border-padella-cream/15 rounded-xl text-padella-cream/40 hover:text-padella-cream/70 hover:border-padella-cream/30 transition-all flex items-center justify-center gap-2 text-sm">
          <Plus size={16} />
          Aggiungi Speciale del Giorno
        </button>
      )}

      {/* Preview note */}
      <div className="mt-6 p-4 bg-padella-gold/5 border border-padella-gold/15 rounded-xl">
        <div className="text-padella-gold/70 text-xs font-semibold uppercase tracking-wide mb-1">💡 Come funziona</div>
        <p className="text-padella-cream/45 text-xs leading-relaxed">
          I piatti attivi appaiono automaticamente nella sezione <strong className="text-padella-cream/60">"Daily Special"</strong> del menu pubblico con il badge ⭐.
          Premi <strong className="text-padella-cream/60">"Pubblica Oggi"</strong> per renderli visibili ai clienti.
          Puoi anche gestirlo via <strong className="text-padella-cream/60">Chat AI</strong> scrivendo <em>"Menu del giorno: Risotto 350 THB"</em>.
        </p>
      </div>
    </div>
  );
}
