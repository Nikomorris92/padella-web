"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, MapPin, Clock, Globe, Check, Edit3, Mail, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

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
  whatsapp: "+66 099 374 1930",
  line: "@padella.bkk",
  phone: "+66 063 486 4626",
  email: "info@padella.bkk",
  instagram: "@padellabangkok",
  facebook: "Padella Bangkok",
  website: "www.padella.bkk",
  hours: Object.fromEntries(DAYS.map(d => [d, {
    open: d === "Monday" ? "11:00" : "07:00",
    close: "24:00",
    closed: false,
  }])),
  note: "Closed on Thai New Year (Songkran) and Christmas.",
};

/** Mappa InfoState ↔ site_config keys */
const KEY_MAP: Record<keyof Omit<InfoState, "hours">, string> = {
  name: "restaurant_name",
  tagline: "tagline_home",
  address: "address",
  city: "address_city",
  mapsUrl: "maps_url",
  whatsapp: "whatsapp",
  line: "line_id",
  phone: "phone",
  email: "email",
  instagram: "social_instagram",
  facebook: "social_facebook",
  website: "social_website",
  note: "info_note",
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"generale"|"contatti"|"orari"|"social">("generale");

  const set = (key: keyof InfoState, val: string) => setInfo(p => ({ ...p, [key]: val }));
  const setHour = (day: string, field: keyof Hours, val: string | boolean) =>
    setInfo(p => ({ ...p, hours: { ...p.hours, [day]: { ...p.hours[day], [field]: val } } }));

  // Carica i valori reali dal database all'apertura
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from("site_config").select("key,value");
        if (error) throw error;
        const next = { ...DEFAULT };
        for (const row of (data ?? []) as Array<{ key: string; value: unknown }>) {
          // Map back from site_config keys to InfoState
          for (const [stateKey, dbKey] of Object.entries(KEY_MAP)) {
            if (row.key === dbKey && typeof row.value === "string") {
              (next as unknown as Record<string, unknown>)[stateKey] = row.value;
            }
          }
          if (row.key === "hours" && typeof row.value === "object" && row.value) {
            next.hours = row.value as Record<string, Hours>;
          }
        }
        setInfo(next);
      } catch (e) {
        console.warn("Errore caricamento info:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Salvataggio REALE su Supabase
  const save = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Costruisco array di righe site_config da fare upsert
      const rows: Array<{ key: string; value: unknown; updated_at: string }> = [];
      const now = new Date().toISOString();
      const infoRec = info as unknown as Record<string, unknown>;
      for (const [stateKey, dbKey] of Object.entries(KEY_MAP)) {
        rows.push({ key: dbKey, value: infoRec[stateKey], updated_at: now });
      }
      rows.push({ key: "hours", value: info.hours, updated_at: now });

      const { error } = await supabase.from("site_config").upsert(rows as never);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Salvataggio fallito:", err);
      setSaveError(err instanceof Error ? err.message : "Update failed. The data was not saved.");
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: "generale",  label: "General" },
    { id: "contatti",  label: "Contacts" },
    { id: "orari",     label: "Hours" },
    { id: "social",    label: "Social & Web" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0c1710] p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-padella-cream text-2xl md:text-3xl mb-1">Edit Info</h1>
            <p className="text-padella-cream/35 text-sm">Update contacts, hours and restaurant info</p>
          </div>
          <motion.button
            onClick={save} whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              saveError ? "bg-red-500 text-white" : saved ? "bg-green-500 text-white" : "bg-padella-gold text-padella-green hover:bg-padella-gold/90"
            } ${saving ? "opacity-60 cursor-wait" : ""}`}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : saveError ? <><AlertCircle size={14} /> Error</> : saved ? <><Check size={14} /> Saved!</> : <><Edit3 size={14} /> Save</>}
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
              <h3 className="text-padella-cream/60 text-xs font-semibold uppercase tracking-wide">Identity</h3>
              <Field label="Restaurant name" value={info.name} onChange={v => set("name",v)} />
              <Field label="Tagline / Slogan" value={info.tagline} onChange={v => set("tagline",v)} placeholder="Play. Relax. Eat. Connect." />
            </div>
            <div className="bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-5 space-y-4">
              <h3 className="text-padella-cream/60 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5"><MapPin size={11}/> Address</h3>
              <Field label="Street / Soi" value={info.address} onChange={v => set("address",v)} placeholder="123 Sukhumvit Soi XX" />
              <Field label="City and ZIP" value={info.city} onChange={v => set("city",v)} placeholder="Bangkok 10110" />
              <Field label="Google Maps URL" value={info.mapsUrl} onChange={v => set("mapsUrl",v)} placeholder="https://maps.google.com/..." icon={Globe} />
            </div>
            <div className="bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-5">
              <h3 className="text-padella-cream/60 text-xs font-semibold uppercase tracking-wide mb-3">Special notes</h3>
              <textarea value={info.note} onChange={e => setInfo(p => ({ ...p, note: e.target.value }))} rows={3}
                placeholder="E.g.: Closed on Thai New Year, Christmas..."
                className="w-full px-4 py-2.5 bg-[#0c1710] border border-padella-cream/10 rounded-xl text-padella-cream text-sm placeholder-padella-cream/20 outline-none focus:border-padella-gold/40 resize-none transition-colors" />
            </div>
          </motion.div>
        )}

        {/* ── CONTATTI ── */}
        {tab === "contatti" && (
          <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} className="space-y-4">
            <div className="bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-5 space-y-4">
              <h3 className="text-padella-cream/60 text-xs font-semibold uppercase tracking-wide">Numbers & Contacts</h3>
              <Field label="WhatsApp" value={info.whatsapp} onChange={v => set("whatsapp",v)} placeholder="+66 063 486 4626" icon={Phone} />
              <Field label="LINE ID" value={info.line} onChange={v => set("line",v)} placeholder="@padella.bkk" />
              <Field label="Landline" value={info.phone} onChange={v => set("phone",v)} placeholder="+66 063 486 4626" icon={Phone} />
              <Field label="Email" value={info.email} onChange={v => set("email",v)} placeholder="info@padella.bkk" icon={Mail} type="email" />
            </div>
            {/* Preview */}
            <div className="bg-padella-gold/5 border border-padella-gold/15 rounded-2xl p-5">
              <h3 className="text-padella-gold/60 text-[10px] font-semibold uppercase tracking-wide mb-3">👁️ Footer preview</h3>
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
              <h3 className="text-padella-cream/60 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5"><Clock size={11}/> Weekly hours</h3>
              {DAYS.map(day => {
                const h = info.hours[day];
                return (
                  <div key={day} className={`flex items-center gap-3 py-2 border-b border-padella-cream/4 last:border-0 ${h.closed ? "opacity-40" : ""}`}>
                    <div className="w-20 text-padella-cream/60 text-xs font-medium flex-shrink-0">{day.slice(0,3)}</div>
                    {h.closed ? (
                      <span className="text-padella-cream/30 text-xs italic">Closed</span>
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
                      {h.closed ? "Open" : "Close"}
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
              <h3 className="text-padella-cream/60 text-[10px] font-semibold uppercase tracking-wide mb-4">Social links preview</h3>
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
            saveError ? "bg-red-500 text-white" : saved ? "bg-green-500 text-white" : "bg-padella-gold text-padella-green hover:bg-padella-gold/90"
          } ${saving ? "opacity-60 cursor-wait" : ""}`}>
          {saving ? "⏳ Saving..." : saveError ? `⚠️ ${saveError}` : saved ? "✅ Changes saved successfully!" : "Save all changes"}
        </motion.button>
      </div>
    </div>
  );
}
