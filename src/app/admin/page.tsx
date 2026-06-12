"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart2, Users, Eye, MessageSquare, QrCode, TrendingUp, Calendar, ChefHat, Sparkles, Info, Camera, CalendarCheck } from "lucide-react";

const stats = [
  { label: "Prenotazioni",    value: "127",    change: "+22%", icon: CalendarCheck, color: "text-padella-gold",     bg: "bg-padella-gold/10" },
  { label: "Page Views",      value: "12,847", change: "+18%", icon: Eye,           color: "text-blue-400",        bg: "bg-blue-400/10" },
  { label: "WhatsApp Clicks", value: "342",    change: "+24%", icon: MessageSquare, color: "text-green-400",       bg: "bg-green-400/10" },
  { label: "QR Scans",        value: "1,456",  change: "+31%", icon: QrCode,        color: "text-padella-terracotta", bg: "bg-padella-terracotta/10" },
];

const reservations = [
  { name: "Marco R.",   pax: 4, date: "Oggi 20:30",    status: "confirmed" },
  { name: "Sofia L.",   pax: 2, date: "Oggi 21:00",    status: "confirmed" },
  { name: "James T.",   pax: 6, date: "Dom 19:30",     status: "pending" },
  { name: "Yuki N.",    pax: 3, date: "Lun 20:00",     status: "confirmed" },
  { name: "Anna M.",    pax: 8, date: "Mar 13:00",     status: "pending" },
];

const topPhotos = [
  { name: "Pizza Tartufata",      clicks: 847, category: "Pizza",   img: "/images/food/pizza-salsiccia.jpg" },
  { name: "Burrata Pugliese",     clicks: 723, category: "Starter", img: "/images/food/burrata-rucola.jpg" },
  { name: "Tagliatelle al Ragù",  clicks: 698, category: "Pasta",   img: "/images/food/tagliere-salumi.jpg" },
  { name: "Aperol Spritz Padella",clicks: 612, category: "Drink",   img: null },
  { name: "Tiramisù della Casa",  clicks: 589, category: "Dessert", img: "/images/food/muffin-colazione.jpg" },
];

const QUICK = [
  { href: "/admin/chat",     icon: Sparkles,      label: "Chat AI",         sub: "Gestione rapida",    gold: true },
  { href: "/admin/menu-ai",  icon: ChefHat,       label: "Crea Menu",       sub: "Aggiungi piatti" },
  { href: "/admin/info",     icon: Info,          label: "Modifica Info",   sub: "Contatti & orari" },
  { href: "/admin/photos",   icon: Camera,        label: "Photo Studio",    sub: "Filtro brand AI" },
  { href: "/admin/daily",    icon: Calendar,      label: "Menu del Giorno", sub: "Speciale oggi" },
  { href: "/admin/qr",       icon: QrCode,        label: "QR Codes",        sub: "Genera & stampa" },
];

export default function AdminDashboard() {
  const [period, setPeriod] = useState<"oggi" | "settimana" | "mese">("settimana");

  return (
    <div className="min-h-screen bg-[#0c1710]">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-padella-cream text-2xl md:text-3xl mb-0.5">Dashboard</h1>
            <p className="text-padella-cream/35 text-sm">Padella Bangkok — Pannello di controllo</p>
          </div>
          <div className="flex gap-1.5">
            {(["oggi","settimana","mese"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${period === p ? "bg-padella-gold text-padella-green" : "bg-[#1a2e1f] text-padella-cream/50 hover:text-padella-cream/80"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-4">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon size={16} className={s.color} />
              </div>
              <div className="font-bold text-padella-cream text-xl font-display">{s.value}</div>
              <div className="text-padella-cream/35 text-xs mt-0.5">{s.label}</div>
              <div className="text-green-400 text-[10px] font-semibold mt-1">{s.change}</div>
            </div>
          ))}
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-8">
          {QUICK.map(q => (
            <Link key={q.href} href={q.href}
              className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border transition-all group text-center ${
                q.gold
                  ? "bg-padella-gold/10 border-padella-gold/25 hover:bg-padella-gold/20"
                  : "bg-[#1a2e1f] border-padella-cream/6 hover:border-padella-cream/15"
              }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${q.gold ? "bg-padella-gold/20" : "bg-padella-cream/5 group-hover:bg-padella-cream/10"}`}>
                <q.icon size={15} className={q.gold ? "text-padella-gold" : "text-padella-cream/50"} />
              </div>
              <div>
                <div className={`text-[11px] font-semibold leading-tight ${q.gold ? "text-padella-gold" : "text-padella-cream/70"}`}>{q.label}</div>
                <div className="text-[9px] text-padella-cream/25 mt-0.5">{q.sub}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── Prenotazioni recenti ── */}
          <div className="lg:col-span-3 bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-padella-cream text-sm flex items-center gap-2">
                <CalendarCheck size={15} className="text-padella-gold" /> Prenotazioni
              </h3>
              <Link href="/admin/info" className="text-padella-gold/60 text-[10px] hover:text-padella-gold">Vedi tutte →</Link>
            </div>
            <div className="space-y-2">
              {reservations.map((r, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-padella-cream/4 last:border-0">
                  <div className="w-7 h-7 rounded-full bg-padella-gold/10 flex items-center justify-center flex-shrink-0">
                    <Users size={11} className="text-padella-gold/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-padella-cream/80 text-xs font-medium">{r.name}</div>
                    <div className="text-padella-cream/30 text-[10px]">{r.date} · {r.pax} pers.</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                    r.status === "confirmed"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-yellow-500/15 text-yellow-400"
                  }`}>
                    {r.status === "confirmed" ? "Confermata" : "In attesa"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Foto più cliccate ── */}
          <div className="lg:col-span-2 bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-5">
            <h3 className="font-semibold text-padella-cream text-sm flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-padella-gold" /> Foto più cliccate
            </h3>
            <div className="space-y-3">
              {topPhotos.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-padella-green flex-shrink-0">
                    {p.img
                      /* eslint-disable-next-line @next/next/no-img-element */
                      ? <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-lg">🍹</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-padella-cream/75 text-xs font-medium truncate">{p.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1 bg-padella-cream/5 rounded-full">
                        <div className="h-1 bg-padella-gold/60 rounded-full" style={{ width: `${(p.clicks / topPhotos[0].clicks) * 100}%` }} />
                      </div>
                      <span className="text-padella-gold text-[10px] font-semibold flex-shrink-0">{p.clicks}</span>
                    </div>
                  </div>
                  <span className="text-padella-cream/20 text-[10px] flex-shrink-0">#{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          {[
            { label: "Posti disponibili stasera", value: "12", icon: "🪑" },
            { label: "Ordini WhatsApp oggi",       value: "8",  icon: "💬" },
            { label: "Recensioni Google",          value: "4.8 ★", icon: "⭐" },
          ].map(b => (
            <div key={b.label} className="bg-[#1a2e1f] border border-padella-cream/6 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">{b.icon}</span>
              <div>
                <div className="text-padella-cream font-bold text-lg font-display">{b.value}</div>
                <div className="text-padella-cream/35 text-xs">{b.label}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
