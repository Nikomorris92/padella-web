"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

type ConfigValue = unknown;
type ConfigMap = Record<string, ConfigValue>;

interface SiteConfigCtx {
  config: ConfigMap;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const DEFAULTS: ConfigMap = {
  whatsapp: "+66 099 374 1930",
  phone: "+66 063 486 4626",
  line_id: "@padellabangkok",
  tagline_home: "Play. Relax. Eat. Connect.",
  theme_gold: "#C9A84C",
  theme_green: "#1B3A2D",
  font_heading: "Playfair Display",
  font_body: "Inter",
  show_section_padel: true,
  show_section_pool: true,
  show_section_gallery: true,
  show_section_community: true,
  show_category_count: false,
};

const Ctx = createContext<SiteConfigCtx>({ config: DEFAULTS, isLoading: true, refresh: async () => {} });

export function useSiteConfig() { return useContext(Ctx); }

/** Provider che carica /site_config da Supabase e si aggiorna in real-time.
 *  Applica anche CSS custom properties per tema + carica Google Fonts dinamicamente. */
export default function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ConfigMap>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("site_config").select("key,value");
    if (!data) { setIsLoading(false); return; }
    const next: ConfigMap = { ...DEFAULTS };
    for (const row of data as Array<{ key: string; value: ConfigValue }>) next[row.key] = row.value;
    setConfig(next);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase.channel("site_config_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_config" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Applica CSS custom properties — sovrascrive le variabili usate da Tailwind/globals.css
  useEffect(() => {
    const root = document.documentElement;
    const gold = typeof config.theme_gold === "string" ? config.theme_gold : "#C9A84C";
    const green = typeof config.theme_green === "string" ? config.theme_green : "#1B3A2D";
    root.style.setProperty("--color-padella-gold", gold);
    root.style.setProperty("--color-padella-green", green);
  }, [config.theme_gold, config.theme_green]);

  // Carica Google Fonts dinamicamente
  useEffect(() => {
    const heading = typeof config.font_heading === "string" ? config.font_heading : "Playfair Display";
    const body = typeof config.font_body === "string" ? config.font_body : "Inter";
    const id = "padella-dynamic-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    const enc = (s: string) => s.replace(/ /g, "+");
    link.href = `https://fonts.googleapis.com/css2?family=${enc(heading)}:ital,wght@0,400;0,700;1,400&family=${enc(body)}:wght@300;400;500;600;700&display=swap`;
    document.documentElement.style.setProperty("--font-display", `"${heading}", Georgia, serif`);
    document.documentElement.style.setProperty("--font-body", `"${body}", system-ui, sans-serif`);
  }, [config.font_heading, config.font_body]);

  const value = useMemo(() => ({ config, isLoading, refresh: load }), [config, isLoading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
