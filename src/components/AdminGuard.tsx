"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

/** Protegge tutte le pagine /admin/* tranne /admin/login.
 *  Reindirizza al login se non c'è sessione Supabase attiva. */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // Login page non protetta
    if (isLoginPage) { setChecking(false); return; }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        router.replace("/admin/login");
      } else {
        localStorage.setItem("padella_admin", "true");
        setChecking(false);
      }
    });

    // Listener: se l'utente fa logout altrove, kick fuori
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isLoginPage) router.replace("/admin/login");
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [isLoginPage, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c1710]" style={{ minHeight: "100dvh" }}>
        <div className="flex items-center gap-2 text-padella-cream/40 text-sm">
          <Loader2 size={16} className="animate-spin text-padella-gold" />
          Verifica accesso...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
