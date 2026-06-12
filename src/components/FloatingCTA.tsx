"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Phone, X, Calendar, ChevronUp } from "lucide-react";

export default function FloatingCTA() {
  const [open, setOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handle = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <>
      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-28 right-4 md:right-6 z-40 w-10 h-10 rounded-full glass border border-padella-cream/20 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <ChevronUp size={18} className="text-padella-cream/70" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating action panel */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="flex flex-col gap-2"
            >
              {[
                { href: "https://wa.me/66XXXXXXXXX?text=Hi%20Padella!", icon: "💬", label: "WhatsApp", color: "bg-green-600 hover:bg-green-500" },
                { href: "https://line.me/ti/p/XXXXXXXX", icon: "💚", label: "LINE", color: "bg-[#00B900] hover:bg-[#00C900]" },
                { href: "tel:+66XXXXXXXXX", icon: "📞", label: "Call Us", color: "bg-padella-terracotta hover:bg-padella-terracotta-light" },
                { href: "/reservations", icon: "📅", label: "Reserve", color: "bg-padella-gold hover:bg-padella-gold-light text-padella-green" },
              ].map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-full shadow-premium text-white text-sm font-medium ${item.color} transition-all duration-200`}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </motion.a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          onClick={() => setOpen(!open)}
          whileTap={{ scale: 0.93 }}
          className="w-14 h-14 bg-padella-gold rounded-full shadow-glow flex items-center justify-center hover:bg-padella-gold-light transition-all duration-300"
        >
          <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.3 }}>
            {open ? <X size={22} className="text-padella-green" /> : <MessageCircle size={22} className="text-padella-green" />}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
