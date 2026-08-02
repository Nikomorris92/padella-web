"use client";

import Link from "next/link";
import { useSiteConfig } from "@/components/SiteConfigProvider";

const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];


const footerLinks = {
  Explore: [
    { href: "/menu", label: "Menu" },
    { href: "/padel", label: "Padel Club" },
    { href: "/pool", label: "Pool & Lounge" },
    { href: "/gallery", label: "Gallery" },
  ],
  "Our Story": [
    { href: "/about", label: "About Padella" },
    { href: "/community", label: "Community" },
    { href: "/membership", label: "Membership" },
    { href: "/loyalty", label: "Loyalty Program" },
    { href: "/careers", label: "Careers" },
  ],
  Visit: [
    { href: "/reservations", label: "Book a Table" },
    { href: "/padel#booking", label: "Book a Court" },
    { href: "/contact", label: "Contact Us" },
    { href: "/faq", label: "FAQ" },
  ],
};

interface Hours { open: string; close: string; closed: boolean; }

export default function Footer() {
  const { config } = useSiteConfig();
  const address = typeof config.address === "string" ? config.address : "";
  const addressCity = typeof config.address_city === "string" ? config.address_city : "";
  const phone = typeof config.phone === "string" ? config.phone : "";
  const email = typeof config.email === "string" ? config.email : "";
  const hours = (config.hours && typeof config.hours === "object" ? config.hours : null) as Record<string, Hours> | null;

  // Raggruppa i giorni con lo stesso orario in fasce leggibili (es. "Mon–Thu")
  const hourGroups = (() => {
    if (!hours) return null;
    const groups: { days: string[]; time: string }[] = [];
    for (const day of DAY_ORDER) {
      const h = hours[day];
      if (!h) continue;
      const time = h.closed ? "Closed" : `${h.open} – ${h.close}`;
      const last = groups[groups.length - 1];
      if (last && last.time === time) last.days.push(day);
      else groups.push({ days: [day], time });
    }
    return groups.map(g => ({
      label: g.days.length > 1 ? `${g.days[0].slice(0,3)}–${g.days[g.days.length-1].slice(0,3)}` : g.days[0].slice(0,3),
      time: g.time,
    }));
  })();

  return (
    <footer className="bg-padella-charcoal text-padella-cream/70 pt-20 pb-10">
      <div className="container-padella">
        {/* Top */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-padella-gold rounded-full flex items-center justify-center">
                <span className="text-padella-green font-display font-bold text-xl">P</span>
              </div>
              <div>
                <div className="font-display font-semibold text-padella-cream text-xl">PADELLA</div>
                <div className="text-padella-gold/60 text-xs tracking-[0.3em] uppercase">Bangkok</div>
              </div>
            </div>
            <p className="text-padella-cream/50 leading-relaxed mb-6 max-w-sm">
              The ultimate Italian lifestyle destination in Bangkok. Where sport meets flavour, and every moment becomes a memory.
            </p>
            <div className="text-padella-cream/40 text-sm space-y-1">
              <p>📍 {address ? `${address}${addressCity ? ", " + addressCity : ""}` : "Bangkok, Thailand"}</p>
              {phone && <p>📞 {phone}</p>}
              {email && <p>✉️ {email}</p>}
            </div>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all">
                <span className="text-sm">📷</span>
              </a>
              <a href="#" className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all">
                <span className="text-sm">👥</span>
              </a>
              <a href="#" className="w-9 h-9 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-all">
                <span className="text-padella-cream/70 text-sm">▶</span>
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-padella-cream text-sm font-semibold tracking-[0.15em] uppercase mb-5">{title}</h4>
              <ul className="space-y-3">
                {links.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm hover:text-padella-gold transition-colors duration-200">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Opening hours */}
        <div className="border-t border-padella-cream/10 pt-10 mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {(hourGroups && hourGroups.length > 0 ? hourGroups : [
              { label: "Mon–Thu", time: "11:00 – 23:00" },
              { label: "Fri–Sat", time: "11:00 – 00:00" },
              { label: "Sunday", time: "10:00 – 23:00" },
            ]).map(h => ({ day: h.label, time: h.time })).map(h => (
              <div key={h.day}>
                <div className="text-padella-gold/70 text-xs tracking-[0.15em] uppercase mb-1">{h.day}</div>
                <div className="text-padella-cream/80 text-sm font-medium">{h.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tagline marquee */}
        <div className="border-t border-padella-cream/10 pt-8 mb-8 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="text-padella-cream/20 text-xs tracking-[0.4em] uppercase mr-20">
                PLAY &nbsp;•&nbsp; RELAX &nbsp;•&nbsp; EAT &nbsp;•&nbsp; CONNECT &nbsp;•&nbsp; PADELLA BANGKOK &nbsp;•&nbsp;
              </span>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-padella-cream/30">
          <p>© {new Date().getFullYear()} Padella Bangkok. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-padella-cream/60 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-padella-cream/60 transition-colors">Terms of Service</Link>
          </div>
          <p>Designed with ♥ in Bangkok</p>
        </div>
      </div>
    </footer>
  );
}
