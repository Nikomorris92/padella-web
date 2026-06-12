"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const words = ["PLAY.", "RELAX.", "EAT.", "CONNECT."];
const pillars = [
  { icon: "🎾", title: "Padel Courts", desc: "4 world-class courts with night lighting. Lessons, tournaments, and open play all week." },
  { icon: "🏊", title: "Pool & Lounge", desc: "Mediterranean-inspired pool surrounded by lush greenery and cabanas. Pure relaxation." },
  { icon: "🍝", title: "Italian Cuisine", desc: "Authentic recipes, premium ingredients, and the warmth of an Italian kitchen — in Bangkok." },
  { icon: "🥂", title: "Bar & Aperitivo", desc: "Handcrafted cocktails, Italian spirits, and the finest aperitivo hour in the city." },
];

export default function ManifestoSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section ref={ref} className="py-section bg-padella-cream relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-padella-terracotta/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-padella-gold/5 rounded-full blur-3xl" />

      <div className="container-padella relative">
        {/* Manifesto words */}
        <div className="flex flex-wrap gap-4 md:gap-6 justify-center mb-16">
          {words.map((w, i) => (
            <motion.span
              key={w}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              className="font-display font-bold text-padella-green leading-none"
              style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)", letterSpacing: "-0.02em" }}
            >
              {w}
            </motion.span>
          ))}
        </div>

        <div className="divider-gold !w-24 mb-12" style={{ background: "linear-gradient(to right, transparent, #1B3A2D, transparent)", height: "1px" }} />

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="text-padella-green/60 text-lg md:text-xl text-center max-w-2xl mx-auto mb-20 leading-relaxed font-light"
        >
          Padella is not just a restaurant. It&apos;s a destination — where sport, food, and the Italian spirit of life come together under the Bangkok sun.
        </motion.p>

        {/* Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.6 }}
              className="group bg-padella-green/5 border border-padella-green/10 rounded-xl3 p-6 hover:bg-padella-green/10 hover:border-padella-green/20 transition-all duration-400 hover:-translate-y-1"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{p.icon}</div>
              <h3 className="font-display font-semibold text-padella-green text-lg mb-2">{p.title}</h3>
              <p className="text-padella-green/55 text-sm leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
