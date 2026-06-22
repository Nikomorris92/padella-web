"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import OfficialLogo from "@/components/OfficialLogo";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/padel", label: "Padel" },
  { href: "/pool", label: "Pool" },
  { href: "/gallery", label: "Gallery" },
  { href: "/community", label: "Community" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Show admin button only if the user has previously accessed /admin
    setIsAdmin(localStorage.getItem("padella_admin") === "true");

    const handle = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-padella-green/95 backdrop-blur-xl border-b border-padella-cream/10 shadow-premium"
            : "bg-transparent"
        }`}
      >
        <div className="container-padella flex items-center justify-between h-18 py-4 relative">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative group-hover:scale-110 transition-transform duration-300">
              <OfficialLogo size={72} priority />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-padella-terracotta rounded-full animate-pulse" />
            </div>
          </Link>

          {/* Desktop Links */}
          <ul className="hidden lg:flex items-center gap-7">
            {links.map(l => (
              <li key={l.href}>
                <Link href={l.href} className="nav-link group">
                  {l.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-padella-gold transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="https://wa.me/66993741930?text=Hi%20Padella!%20I'd%20like%20to%20make%20a%20reservation"
              target="_blank" rel="noopener noreferrer"
              className="btn-outline !px-5 !py-2.5 !text-sm"
            >
              Book a Table
            </a>
            <a href="tel:+66634864626" className="w-10 h-10 flex items-center justify-center rounded-full glass hover:bg-white/10 transition-all duration-200">
              <Phone size={16} className="text-padella-cream/70" />
            </a>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(true)} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full glass">
            <Menu size={20} className="text-padella-cream" />
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-padella-charcoal/80 backdrop-blur-sm z-[60]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-padella-green z-[70] flex flex-col p-8"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="font-display font-semibold text-padella-cream text-xl">PADELLA</div>
                <button onClick={() => setOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full glass">
                  <X size={18} className="text-padella-cream" />
                </button>
              </div>
              <ul className="flex flex-col gap-6 flex-1">
                {links.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <Link href={l.href} onClick={() => setOpen(false)}
                      className="text-padella-cream/80 text-2xl font-display font-medium hover:text-padella-gold transition-colors duration-200"
                    >
                      {l.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="flex flex-col gap-3 mt-8">
                <a href="https://wa.me/66993741930" target="_blank" rel="noopener noreferrer"
                  className="btn-primary justify-center">
                  📱 WhatsApp
                </a>
                <a href="https://line.me/ti/p/XXXXXXXX" target="_blank" rel="noopener noreferrer"
                  className="btn-outline justify-center">
                  💬 LINE
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
