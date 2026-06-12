"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    localStorage.setItem("padella_admin", "true");
    router.replace("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0c1710]" style={{ minHeight: "100dvh" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo + title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-padella-gold/15 border border-padella-gold/30 mb-4">
            <Lock size={20} className="text-padella-gold" />
          </div>
          <h1 className="font-display font-bold text-padella-cream text-3xl mb-1">Padella Admin</h1>
          <p className="text-padella-cream/40 text-sm">Accedi per gestire menu, foto e info</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="bg-[#111d16] border border-padella-cream/8 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-padella-cream/50 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail size={11} /> Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="nome@padella.bkk"
              className="w-full px-4 py-3 bg-[#0c1710] border border-padella-cream/10 rounded-xl text-padella-cream text-sm placeholder-padella-cream/20 outline-none focus:border-padella-gold/40 transition-colors"
            />
          </div>

          <div>
            <label className="text-padella-cream/50 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock size={11} /> Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#0c1710] border border-padella-cream/10 rounded-xl text-padella-cream text-sm placeholder-padella-cream/20 outline-none focus:border-padella-gold/40 transition-colors"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs"
            >
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3.5 bg-padella-gold text-padella-green font-semibold text-sm rounded-xl disabled:opacity-40 hover:bg-padella-gold/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Accesso in corso...</> : "Entra"}
          </button>
        </form>

        <p className="text-center text-padella-cream/25 text-[11px] mt-4">
          Accesso riservato al personale autorizzato.
        </p>
      </motion.div>
    </div>
  );
}
