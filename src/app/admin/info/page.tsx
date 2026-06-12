"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, MapPin, Clock, Globe, Check, Edit3, Mail } from "lucide-react";

const DAYS = ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];

interface Hours { open: string; close: string; closed: boolean; }

interface InfoState {
  name: string; tagline: string;
  address: string; city: string; mapsUrl: string;
  whatsapp: string; line: string; phone: string; email: string;
  instagram: string; facebook: string; website: string;
  hours: Record<string, Hours>;
  note: string;
}

const DEFAULT: InfoState = {
  name: "Padella Bangkok",
  tagline: "Play. Relax. Eat. Connect.",
  address: "123 Sukhumvit Soi XX, Watthana",
  city: "Bangkok 10110",
  mapsUrl: "https://maps.google.com/?q=Padella+Bangkok",
  whatsapp: "+66 XX XXXX XXXX",
  line: "@padella.bkk",
  phone: "+66 XX XXXX XXXX",
  email: "info@padella.bkk",
  instagram: "@padellabangkok",
  facebook: "Padella Bangkok",
  website: "www.padella.bkk",
  hours: Object.fromEntries(DAYS.map(d => [d, {
    open: d === "Lunedì" ? "11:00" : "07:00",
    close: "24:00",
    closed: false,
  }])),
  note: "Chiusi il giorno di Capodanno Thai (Songkran) e Natale.",
};

function Field({ label, value, onChange, placeholder, icon: Icon, type="text" }:
  { label: string; value: string; onChange: (v: string)=>void; placeholder?: string; icon?: React.ComponentType<{ size?: number; className?: string }>; type?: string }) {
  return (
    <div>
      <label className="text-padella-cream/40 text-[10px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon size={11} />} {label}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-[#0c1710] border border-padella-cream/10 rounded-xl text-padella-cream text-sm placeholder-padella-cream/20 outline-none focus:border-padella-gold/40 transition-colors" />
    </div>
  );
}

export default function AdminInfoPage() {
  const [info, setInfo] = useState<InfoState>(DEFAULT);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"generale"|"contatti"|"orari"|"social">("generale");

  const set = (key: keyof InfoState, val: string) => setInfo(p => ({ ...p, [key]: val }));
  const setHour = (day: string, field: keyof Hours, val: string | boolean) =>
    setInfo(p => ({ ...p, hours: { ...p.hours, [day]: { ...p.hours[day], [field]: val } } }));

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const TABS = [
    { id: "generale",  label: "Generale" },
    { id: "contatti",  label: "Contatti" },
    { id: "orari",     label: "Orari" },
    { id: "social",    label: "Social & Web" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0c1710] p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-padella-cream text-2xl md:text-3xl mb-1">Modifica Info</h1>
            <p className="text-padella-cream/35 text-sm">Aggiorna contatti, orari e informazioni del ristorante</p>
          </div>
          <motion.button
            onClick={save} whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              saved ? "bg-green-500 text-white" : "bg-padella-gold text-padella-green hover:bg-padella-gold/90"
            }`}>
            {saved ? <><Check size={14} /> Salvato!</> : <><Edit3 size={14} /> Salva</>}
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111d16] p-1 rounded-2xl mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === t.id ? "bg-padella-gold text-padella-green" : "text-padella-cream/40 hover:text-padella-cream/70"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── GENERALE ── */}
        {tab === "generale" && (
          <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} className="space-y-4">
            <div className="bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-5 space-y-4">
              <h3 className="text-padella-cream/60 text-xs font-semibold uppercase tracking-wide">Identità</h3>
              <Field label="Nome ristorante" value={info.name} onChange={v => set("name",v)} />
              <Field label="Tagline / Slogan" value={info.tagline} onChange={v => set("tagline",v)} placeholder="Play. Relax. Eat. Connect." />
            </div>
            <div className="bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-5 space-y-4">
              <h3 className="text-padella-cream/60 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5"><MapPin size={11}/> Indirizzo</h3>
              <Field label="Via / Soi" value={info.address} onChange={v => set("address",v)} placeholder="123 Sukhumvit Soi XX" />
              <Field label="Città e CAP" value={info.city} onChange={v => set("city",v)} placeholder="Bangkok 10110" />
              <Field label="Google Maps URL" value={info.mapsUrl} onChange={v => set("mapsUrl",v)} placeholder="https://maps.google.com/..." icon={Globe} />
            </div>
            <div className="bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-5">
              <h3 className="text-padella-cream/60 text-xs font-semibold uppercase tracking-wide mb-3">Note speciali</h3>
              <textarea value={info.note} onChange={e => setInfo(p => ({ ...p, note: e.target.value }))} rows={3}
                placeholder="Es: Chiusi il giorno di Capodanno..."
                className="w-full px-4 py-2.5 bg-[#0c1710] border border-padella-cream/10 rounded-xl text-padella-cream text-sm placeholder-padella-cream/20 outline-none focus:border-padella-gold/40 resize-none transition-colors" />
            </div>
          </motion.div>
        )}

        {/* ── CONTATTI ── */}
        {tab === "contatti" && (
          <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} className="space-y-4">
            <div className="bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-5 space-y-4">
              <h3 className="text-padella-cream/60 text-xs font-semibold uppercase tracking-wide">Numeri & Contatti</h3>
              <Field label="WhatsApp" value={info.whatsapp} onChange={v => set("whatsapp",v)} placeholder="+66 XX XXXX XXXX" icon={Phone} />
              <Field label="LINE ID" value={info.line} onChange={v => set("line",v)} placeholder="@padella.bkk" />
              <Field label="Telefono fisso" value={info.phone} onChange={v => set("phone",v)} placeholder="+66 XX XXXX XXXX" icon={Phone} />
              <Field label="Email" value={info.email} onChange={v => set("email",v)} placeholder="info@padella.bkk" icon={Mail} type="email" />
            </div>
            {/* Preview */}
            <div className="bg-padella-gold/5 border border-padella-gold/15 rounded-2xl p-5">
              <h3 className="text-padella-gold/60 text-[10px] font-semibold uppercase tracking-wide mb-3">👁️ Anteprima footer</h3>
              <div className="space-y-2 text-padella-cream/60 text-sm">
                <div className="flex items-center gap-2"><Phone size={12}/> {info.phone}</div>
                <div className="flex items-center gap-2"><span className="text-xs">💬</span> WhatsApp: {info.whatsapp}</div>
                <div className="flex items-center gap-2"><span className="text-xs">🟢</span> LINE: {info.line}</div>
                <div className="flex items-center gap-2"><Mail size={12}/> {info.email}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── ORARI ── */}
        {tab === "orari" && (
          <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }}>
            <div className="bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-5 space-y-3">
              <h3 className="text-padella-cream/60 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5"><Clock size={11}/> Orari settimanali</h3>
              {DAYS.map(day => {
                const h = info.hours[day];
                return (
                  <div key={day} className={`flex items-center gap-3 py-2 border-b border-padella-cream/4 last:border-0 ${h.closed ? "opacity-40" : ""}`}>
                    <div className="w-20 text-padella-cream/60 text-xs font-medium flex-shrink-0">{day.slice(0,3)}</div>
                    {h.closed ? (
                      <span className="text-padella-cream/30 text-xs italic">Chiuso</span>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <input type="time" value={h.open} onChange={e => setHour(day,"open",e.target.value)}
                          className="px-2 py-1 bg-[#0c1710] border border-padella-cream/10 rounded-lg text-padella-cream text-xs outline-none focus:border-padella-gold/30 w-24" />
                        <span className="text-padella-cream/20 text-xs">→</span>
                        <input type="time" value={h.close} onChange={e => setHour(day,"close",e.target.value)}
                          className="px-2 py-1 bg-[#0c1710] border border-padella-cream/10 rounded-lg text-padella-cream text-xs outline-none focus:border-padella-gold/30 w-24" />
                      </div>
                    )}
                    <button onClick={() => setHour(day,"closed",!h.closed)}
                      className={`ml-auto px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                        h.closed ? "bg-red-500/15 text-red-400 hover:bg-green-500/15 hover:text-green-400" : "bg-green-500/10 text-green-400/70 hover:bg-red-500/15 hover:text-red-400"
                      }`}>
                      {h.closed ? "Apri" : "Chiudi"}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── SOCIAL ── */}
        {tab === "social" && (
          <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} className="space-y-4">
            <div className="bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-5 space-y-4">
              <h3 className="text-padella-cream/60 text-xs font-semibold uppercase tracking-wide">Social & Web</h3>
              <Field label="Instagram" value={info.instagram} onChange={v => set("instagram",v)} placeholder="@padellabangkok" />
              <Field label="Facebook" value={info.facebook} onChange={v => set("facebook",v)} placeholder="Padella Bangkok" />
              <Field label="Website" value={info.website} onChange={v => set("website",v)} placeholder="www.padella.bkk" icon={Globe} />
            </div>
            {/* Social preview */}
            <div className="bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-5">
              <h3 className="text-padella-cream/60 text-[10px] font-semibold uppercase tracking-wide mb-4">Anteprima link socials</h3>
              <div className="flex gap-3">
                {[
                  { label: "IG", val: info.instagram, color: "bg-pink-500/20 text-pink-400 border-pink-500/20" },
                  { label: "FB", val: info.facebook,  color: "bg-blue-500/20 text-blue-400 border-blue-500/20" },
                  { label: "WEB",val: info.website,   color: "bg-padella-gold/10 text-padella-gold border-padella-gold/15" },
                ].map(s => (
                  <div key={s.label} className={`flex-1 border rounded-xl p-3 text-center ${s.color}`}>
                    <div className="text-[10px] font-bold mb-1">{s.label}</div>
                    <div className="text-[9px] truncate opacity-70">{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Save button bottom */}
        <motion.button
          onClick={save} whileTap={{ scale: 0.97 }}
          className={`w-full mt-6 py-3.5 rounded-2xl font-semibold text-sm transition-all ${
            saved ? "bg-green-500 text-white" : "bg-padella-gold text-padella-green hover:bg-padella-gold/90"
          }`}>
          {saved ? "✅ Modifiche salvate!" : "Salva tutte le modifiche"}
        </motion.button>
      </div>
    </div>
  );
}
