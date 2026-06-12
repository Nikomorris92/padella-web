"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart2, ChefHat, QrCode, MessageSquare, Calendar, Menu, X, LogOut, Camera, Info, Sparkles } from "lucide-react";
import AdminGuard from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/admin",          label: "Dashboard",       icon: BarChart2,     sub: "Statistiche & analytics" },
  { href: "/admin/chat",     label: "Chat AI",         icon: Sparkles,      sub: "Gestione rapida",  gold: true },
  { href: "/admin/menu-ai",  label: "Crea Menu",       icon: ChefHat,       sub: "Aggiungi piatti AI" },
  { href: "/admin/daily",    label: "Menu del Giorno", icon: Calendar,      sub: "Speciale oggi" },
  { href: "/admin/photos",   label: "Photo Studio AI", icon: Camera,        sub: "Filtro & sfondo" },
  { href: "/admin/info",     label: "Modifica Info",   icon: Info,          sub: "Contatti & orari" },
  { href: "/admin/qr",       label: "QR Codes",        icon: QrCode,        sub: "Genera & stampa" },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isLoginPage = pathname === "/admin/login";

  // Marca questo dispositivo come admin — attiva il cerchio A nella navbar pubblica
  useEffect(() => {
    if (!isLoginPage) localStorage.setItem("padella_admin", "true");
  }, [isLoginPage]);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("padella_admin");
    router.replace("/admin/login");
  };

  // Login page senza chrome (full screen, no sidebar)
  if (isLoginPage) {
    return <AdminGuard>{children}</AdminGuard>;
  }

  return (
   <AdminGuard>
    <div className="min-h-screen bg-[#0f1a14] flex">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[#111d16] border-r border-padella-cream/5 z-50
        transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-padella-cream/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display font-bold text-padella-gold text-xl tracking-tight">PADELLA</div>
              <div className="text-padella-cream/30 text-[10px] tracking-[0.2em] uppercase mt-0.5">Admin Panel</div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-padella-cream/40 hover:text-padella-cream">
              <X size={18} />
            </button>
          </div>
          {/* Status dot */}
          <div className="flex items-center gap-2 mt-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400/70 text-[10px] tracking-wide">Sistema Online</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 space-y-1">
          {NAV.map((navItem) => {
            const { href, label, icon: Icon, sub } = navItem;
            const isGold = "gold" in navItem && navItem.gold;
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${isGold
                    ? active ? "bg-padella-gold/20 border border-padella-gold/30" : "bg-padella-gold/10 border border-padella-gold/15 hover:bg-padella-gold/15"
                    : active ? "bg-padella-gold/15 border border-padella-gold/20" : "hover:bg-padella-cream/5 border border-transparent"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  active ? "bg-padella-gold/20" : "bg-padella-cream/5 group-hover:bg-padella-cream/10"
                }`}>
                  <Icon size={15} className={active ? "text-padella-gold" : isGold ? "text-padella-gold/70" : "text-padella-cream/40"} />
                </div>
                <div>
                  <div className={`text-sm font-medium ${active ? "text-padella-gold" : "text-padella-cream/70"}`}>{label}</div>
                  <div className="text-[10px] text-padella-cream/25">{sub}</div>
                </div>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-padella-gold" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-padella-cream/5 space-y-2">
          <Link href="/" className="flex items-center gap-2 text-padella-cream/30 hover:text-padella-cream/60 transition-colors text-xs">
            <LogOut size={13} />
            Torna al sito
          </Link>
          <button onClick={logout} className="flex items-center gap-2 text-red-400/50 hover:text-red-400 transition-colors text-xs">
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 min-h-screen flex flex-col lg:ml-0">
        {/* Top bar mobile */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-4 border-b border-padella-cream/5 bg-[#111d16]">
          <button onClick={() => setSidebarOpen(true)} className="text-padella-cream/60">
            <Menu size={20} />
          </button>
          <span className="font-display font-bold text-padella-gold text-lg">PADELLA Admin</span>
          {/* Pulsante torna al sito (mobile) */}
          <Link
            href="/"
            className="ml-auto flex items-center justify-center w-9 h-9 rounded-full bg-padella-gold border-2 border-padella-gold hover:scale-110 active:scale-95 transition-all shadow-lg"
            title="Torna al sito"
          >
            <span className="text-padella-green font-display font-bold text-base leading-none select-none">W</span>
          </Link>
        </div>

        {/* Pulsante torna al sito (desktop) — flottante in alto a destra */}
        <Link
          href="/"
          className="hidden lg:flex fixed top-4 right-4 z-50 items-center justify-center w-11 h-11 rounded-full bg-padella-gold border-2 border-padella-gold hover:scale-110 active:scale-95 transition-all shadow-xl"
          title="Torna al sito pubblico"
        >
          <span className="text-padella-green font-display font-bold text-lg leading-none select-none">W</span>
        </Link>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
   </AdminGuard>
  );
}
