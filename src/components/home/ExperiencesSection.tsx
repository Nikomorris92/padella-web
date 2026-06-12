"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const experiences = [
  {
    id: "padel",
    title: "Padel Club",
    subtitle: "4 Professional Courts",
    description: "Bangkok's premier padel destination. Professional courts, certified coaches, weekly tournaments, and a passionate community of players.",
    href: "/padel",
    bg: "bg-padella-green-muted",
    accent: "text-padella-gold",
    tags: ["Open Play", "Lessons", "Tournaments", "Members"],
    stat: "4 courts",
  },
  {
    id: "pool",
    title: "Pool & Lounge",
    subtitle: "Mediterranean Escape",
    description: "A stunning pool surrounded by lush gardens, private cabanas, and pool-side service. Your Mediterranean escape in the heart of Bangkok.",
    href: "/pool",
    bg: "bg-padella-green",
    accent: "text-padella-terracotta",
    tags: ["Cabanas", "Pool Bar", "Sunbeds", "Events"],
    stat: "∞ Relaxation",
  },
  {
    id: "restaurant",
    title: "Italian Kitchen",
    subtitle: "Authentic & Passionate",
    description: "From hand-rolled pasta to wood-fired pizza — every dish tells the story of an Italian region. Seasonal ingredients, timeless recipes.",
    href: "/menu",
    bg: "bg-padella-charcoal-light",
    accent: "text-padella-gold",
    tags: ["Pizza", "Pasta", "Grill", "Desserts"],
    stat: "50+ dishes",
  },
  {
    id: "bar",
    title: "Bar & Aperitivo",
    subtitle: "The Art of Italian Drinking",
    description: "Aperol Spritz, Negroni, Hugo — crafted with care by our Italian bartenders. The best aperitivo hour in Bangkok, every evening.",
    href: "/menu#cocktails",
    bg: "bg-padella-wood",
    accent: "text-padella-cream",
    tags: ["Cocktails", "Wine", "Beer", "Aperitivo"],
    stat: "40+ cocktails",
  },
];

export default function ExperiencesSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} className="py-section bg-padella-green relative">
      <div className="container-padella">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="section-label mb-4">
            <span className="w-8 h-px bg-padella-gold/50" />
            The Padella Experience
            <span className="w-8 h-px bg-padella-gold/50" />
          </div>
          <h2 className="font-display font-bold text-padella-cream" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
            One Place.<br />
            <span className="text-gradient-gold">Endless Experiences.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {experiences.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              className={`group relative ${exp.bg} rounded-xl3 p-8 md:p-10 overflow-hidden cursor-pointer hover:-translate-y-1 transition-all duration-500 border border-padella-cream/5 hover:border-padella-gold/20`}
            >
              {/* Background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-padella-gold/0 to-padella-gold/0 group-hover:from-padella-gold/5 group-hover:to-transparent transition-all duration-500" />

              <div className="relative z-10">
                {/* Stat badge */}
                <div className={`inline-block px-3 py-1 rounded-full bg-padella-cream/10 text-xs font-semibold tracking-wide mb-5 ${exp.accent}`}>
                  {exp.stat}
                </div>

                <h3 className={`font-display font-bold text-3xl md:text-4xl text-padella-cream mb-1`}>{exp.title}</h3>
                <div className={`text-sm font-medium mb-4 ${exp.accent} opacity-80`}>{exp.subtitle}</div>
                <p className="text-padella-cream/60 text-sm leading-relaxed mb-6 max-w-sm">{exp.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {exp.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-padella-cream/10 text-padella-cream/60 text-xs rounded-full">{tag}</span>
                  ))}
                </div>

                <Link href={exp.href} className="inline-flex items-center gap-2 text-padella-gold text-sm font-semibold hover:gap-3 transition-all duration-200 group/link">
                  Explore <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
