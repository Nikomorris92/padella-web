"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Eye, MessageSquare, QrCode, TrendingUp, Calendar, ChefHat, Sparkles, Info, Camera, CalendarCheck, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// All stats start at 0 (clean install). Real values will populate when analytics is wired up.
const stats = [
  { label: "Reservations",    value: "0", change: "", icon: CalendarCheck, color: "text-padella-gold",     bg: "bg-padella-gold/10" },
  { label: "Page Views",      value: "0", change: "", icon: Eye,           color: "text-blue-400",        bg: "bg-blue-400/10" },
  { label: "WhatsApp Clicks", value: "0", change: "", icon: MessageSquare, color: "text-green-400",       bg: "bg-green-400/10" },
  { label: "QR Scans",        value: "0", change: "", icon: QrCode,        color: "text-padella-terracotta", bg: "bg-padella-terracotta/10" },
];

const QUICK = [
  { href: "/admin/chat",     icon: Sparkles, label: "AI Chat",         sub: "Quick management",  gold: true },
  { href: "/admin/menu-ai",  icon: ChefHat,  label: "Create Menu",     sub: "Add dishes" },
  { href: "/admin/info",     icon: Info,     label: "Edit Info",       sub: "Contacts & hours" },
  { href: "/admin/photos",   icon: Camera,   label: "Photo Studio",    sub: "AI brand filter" },
  { href: "/admin/daily",    icon: Calendar, label: "Daily Menu",      sub: "Today special" },
  { href: "/admin/qr",       icon: QrCode,   label: "QR Codes",        sub: "Generate & print" },
];

export default function AdminDashboard() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const [wiping, setWiping] = useState(false);
  const [wipeResult, setWipeResult] = useState<string | null>(null);

  const handleWipeAll = async () => {
    const confirmed = window.confirm("⚠️ This will DELETE ALL menu items, photos, reservations.\n\nThis is IRREVERSIBLE.\n\nProceed?");
    if (!confirmed) return;
    setWiping(true);
    setWipeResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/wipe-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Wipe failed");
      setWipeResult(`✅ Wiped: ${data.menu_items_deleted ?? 0} menu items, ${data.reservations_deleted ?? 0} reservations, ${data.storage_files_removed ?? 0} photos.`);
    } catch (e) {
      setWipeResult(`⚠️ Error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c1710]">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-padella-cream text-2xl md:text-3xl mb-0.5">Dashboard</h1>
            <p className="text-padella-cream/35 text-sm">Padella Bangkok — Control Panel</p>
          </div>
          <div className="flex gap-1.5">
            {(["today","week","month"] as const).map(p => (
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

          {/* ── Recent Reservations (empty until booking system is live) ── */}
          <div className="lg:col-span-3 bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-padella-cream text-sm flex items-center gap-2">
                <CalendarCheck size={15} className="text-padella-gold" /> Reservations
              </h3>
            </div>
            <div className="py-10 text-center">
              <Users size={28} className="mx-auto text-padella-cream/15 mb-2" />
              <p className="text-padella-cream/30 text-xs">No reservations yet.</p>
              <p className="text-padella-cream/20 text-[10px] mt-1">Bookings will appear here once the system is wired up.</p>
            </div>
          </div>

          {/* ── Top dishes (empty until analytics is wired up) ── */}
          <div className="lg:col-span-2 bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-5">
            <h3 className="font-semibold text-padella-cream text-sm flex items-center gap-2 mb-4">
              <TrendingUp size={15} className="text-padella-gold" /> Top Dishes
            </h3>
            <div className="py-10 text-center">
              <TrendingUp size={28} className="mx-auto text-padella-cream/15 mb-2" />
              <p className="text-padella-cream/30 text-xs">No data yet.</p>
              <p className="text-padella-cream/20 text-[10px] mt-1">Stats will populate as customers view dishes.</p>
            </div>
          </div>

        </div>

        {/* ─── DANGER ZONE: Reset all data ─── */}
        <div className="mt-8 bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-300 text-sm mb-1">Danger zone — Reset all data</h3>
              <p className="text-padella-cream/50 text-xs leading-relaxed">
                Permanently deletes all menu items, photos in storage, reservations and events from the database.
                This action <strong>cannot be undone</strong>. Use only for a clean reinstall.
              </p>
            </div>
          </div>
          <button
            onClick={handleWipeAll}
            disabled={wiping}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-50">
            {wiping ? <><Loader2 size={13} className="animate-spin" /> Wiping...</> : <><Trash2 size={13} /> Reset all data</>}
          </button>
          {wipeResult && (
            <div className={`mt-3 p-3 rounded-lg text-xs ${wipeResult.startsWith("✅") ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
              {wipeResult}
            </div>
          )}
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          {[
            { label: "Available seats tonight", value: "—", icon: "🪑" },
            { label: "WhatsApp orders today",   value: "—", icon: "💬" },
            { label: "Google Reviews",          value: "—", icon: "⭐" },
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
