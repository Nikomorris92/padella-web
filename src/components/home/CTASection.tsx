"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

export default function CTASection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} className="py-section bg-padella-green relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-padella-gold/10 via-transparent to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-padella-gold/30 to-transparent" />

      <div className="container-padella text-center relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="text-6xl mb-6">🇮🇹</div>
          <h2
            className="font-display font-bold text-padella-cream mb-4"
            style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)", letterSpacing: "-0.02em" }}
          >
            Ready for Your<br /><span className="text-gradient-gold">Italian Escape?</span>
          </h2>
          <p className="text-padella-cream/60 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Join us for a meal, a match, or a sunset cocktail. Padella is waiting for you.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://wa.me/66XXXXXXXXX?text=Hi%20Padella!%20I'd%20like%20to%20make%20a%20reservation"
              target="_blank" rel="noopener noreferrer"
              className="btn-primary text-base px-10 py-4"
            >
              📅 Book a Table
            </a>
            <a
              href="https://wa.me/66XXXXXXXXX"
              target="_blank" rel="noopener noreferrer"
              className="btn-outline text-base px-10 py-4"
            >
              💬 WhatsApp Us
            </a>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-3 justify-center text-padella-cream/40 text-xs tracking-[0.15em] uppercase">
            <span>📍 Bangkok, Thailand</span>
            <span>🕐 Open Daily 11:00–23:00</span>
            <span>📞 +66 XX XXX XXXX</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
