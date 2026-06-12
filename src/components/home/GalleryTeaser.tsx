"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const placeholders = [
  { emoji: "🍝", label: "Tagliatelle al Ragù", cat: "Food", size: "col-span-1 row-span-2" },
  { emoji: "🎾", label: "Padel Courts", cat: "Padel", size: "col-span-1 row-span-1" },
  { emoji: "🏊", label: "Pool Sunset", cat: "Pool", size: "col-span-1 row-span-1" },
  { emoji: "🍹", label: "Aperol Spritz", cat: "Drinks", size: "col-span-1 row-span-1" },
  { emoji: "🎵", label: "DJ Set Night", cat: "Events", size: "col-span-1 row-span-1" },
  { emoji: "🫒", label: "Burrata Pugliese", cat: "Food", size: "col-span-1 row-span-1" },
];

export default function GalleryTeaser() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} className="py-section bg-padella-cream relative">
      <div className="container-padella">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4"
        >
          <div>
            <div className="section-label !text-padella-green/50 mb-3">
              <span className="w-8 h-px bg-padella-green/20" /> Gallery
            </div>
            <h2 className="font-display font-bold text-padella-green" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              Life at <span className="italic">Padella</span>
            </h2>
          </div>
          <Link href="/gallery" className="btn-ghost !text-padella-green/60 !hover:text-padella-green group self-start md:self-auto">
            Full Gallery <ArrowRight size={14} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 h-[500px] md:h-[600px]">
          {placeholders.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className={`${p.size} relative rounded-xl2 overflow-hidden group cursor-pointer bg-gradient-to-br from-padella-green to-padella-green-muted`}
            >
              <div className="absolute inset-0 flex items-center justify-center text-6xl md:text-7xl opacity-20 group-hover:opacity-30 transition-all duration-500 group-hover:scale-110">
                {p.emoji}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-padella-charcoal/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-padella-gold/80 text-[9px] font-semibold tracking-[0.2em] uppercase">{p.cat}</div>
                <div className="text-padella-cream text-xs font-medium">{p.label}</div>
              </div>
              {/* Category badge */}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-padella-cream/10 backdrop-blur-sm text-padella-cream/70 text-[9px] font-semibold tracking-wide">
                {p.cat}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
