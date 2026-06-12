"use client";

import Link from "next/link";


const footerLinks = {
  Explore: [
    { href: "/menu", label: "Menu" },
    { href: "/padel", label: "Padel Club" },
    { href: "/pool", label: "Pool & Lounge" },
    { href: "/events", label: "Events" },
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
    { href: "/events#calendar", label: "Event Calendar" },
    { href: "/contact", label: "Contact Us" },
    { href: "/faq", label: "FAQ" },
  ],
};

export default function Footer() {
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
              <p>📍 [Address], Bangkok, Thailand</p>
              <p>📞 +66 XX XXX XXXX</p>
              <p>✉️ hello@padellabangkok.com</p>
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
            {[
              { day: "Mon–Thu", time: "11:00 – 23:00" },
              { day: "Fri–Sat", time: "11:00 – 00:00" },
              { day: "Sunday", time: "10:00 – 23:00" },
              { day: "Padel Courts", time: "07:00 – 23:00" },
            ].map(h => (
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
