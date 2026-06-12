"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Users } from "lucide-react";

const events = [
  { type: "🎾", title: "Padel Tournament — Open Mixed", date: "Sat, 14 Jun 2025", time: "08:00", spots: "8 spots left", color: "border-padella-gold/30 hover:border-padella-gold/60", badge: "bg-padella-gold text-padella-green", badgeLabel: "Tournament" },
  { type: "🍹", title: "Italian Aperitivo Night", date: "Fri, 20 Jun 2025", time: "18:00", spots: "Open", color: "border-padella-terracotta/30 hover:border-padella-terracotta/60", badge: "bg-padella-terracotta text-white", badgeLabel: "Aperitivo" },
  { type: "🎵", title: "DJ Set — Riviera Sounds", date: "Sat, 21 Jun 2025", time: "20:00", spots: "Limited", color: "border-padella-gold/20 hover:border-padella-gold/50", badge: "bg-padella-charcoal text-padella-gold border border-padella-gold/40", badgeLabel: "DJ Set" },
  { type: "🥐", title: "Italian Sunday Brunch", date: "Sun, 22 Jun 2025", time: "10:00", spots: "Booking open", color: "border-padella-cream/20 hover:border-padella-cream/40", badge: "bg-padella-green-muted text-padella-cream", badgeLabel: "Brunch" },
];

export default function EventsPreview() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} className="py-section bg-padella-charcoal relative">
      <div className="absolute inset-0 bg-gradient-radial from-padella-green/20 via-transparent to-transparent" />

      <div className="container-padella relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
        >
          <div>
            <div className="section-label mb-3">
              <span className="w-8 h-px bg-padella-gold/50" /> What&apos;s On
            </div>
            <h2 className="font-display font-bold text-padella-cream" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              Upcoming <span className="text-gradient-gold">Events</span>
            </h2>
          </div>
          <Link href="/events" className="btn-ghost !text-padella-gold group self-start md:self-auto">
            All Events <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((ev, i) => (
            <motion.div
              key={ev.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className={`group glass rounded-xl2 p-5 md:p-6 border ${ev.color} transition-all duration-400 cursor-pointer hover:-translate-y-0.5`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">{ev.type}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.badge}`}>{ev.badgeLabel}</span>
                  </div>
                  <h3 className="text-padella-cream font-semibold text-base mb-2 group-hover:text-padella-gold transition-colors">{ev.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-padella-cream/40 text-xs">
                    <span className="flex items-center gap-1"><Calendar size={11} /> {ev.date}</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {ev.time}</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {ev.spots}</span>
                  </div>
                </div>
                <ArrowRight size={16} className="text-padella-cream/30 group-hover:text-padella-gold group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
