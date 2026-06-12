"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, Clock, Users, ArrowRight, CheckCircle } from "lucide-react";

const courts = [
  { num: "01", type: "Panoramic Court", desc: "Open-air rooftop court with Bangkok skyline views. Perfect for sunrise matches.", available: true },
  { num: "02", type: "Indoor Court A",  desc: "Climate-controlled indoor court with professional Mondo flooring.", available: true },
  { num: "03", type: "Indoor Court B",  desc: "Twin of Court A — great for simultaneous group sessions.", available: false },
  { num: "04", type: "Practice Court",  desc: "Dedicated to lessons and ball machine training. Perfect for beginners.", available: true },
];

const packages = [
  { icon: "🎾", title: "Open Play", price: "500", unit: "THB / hr", desc: "Walk-in or book in advance. Courts available 7 days a week.", features: ["All skill levels", "Equipment rental available", "Post-match food & drinks"] },
  { icon: "👨‍🏫", title: "Private Lesson", price: "800", unit: "THB / hr", desc: "1-on-1 with a certified Italian coach. Fastest way to improve.", features: ["Certified FIP coaches", "Video analysis optional", "Personalized program"], popular: true },
  { icon: "🏆", title: "Tournament Entry", price: "300", unit: "THB / event", desc: "Weekly round-robins and monthly open tournaments for all levels.", features: ["Mixed doubles welcome", "Ranking system", "Trophy + F&B included"] },
];

const schedule = [
  { day: "Mon–Fri", time: "07:00 – 11:00", label: "Morning Sessions", emoji: "🌅" },
  { day: "Mon–Fri", time: "18:00 – 22:00", label: "Evening Leagues",  emoji: "🌆" },
  { day: "Sat–Sun", time: "07:00 – 23:00", label: "Weekend Open Play", emoji: "🎉" },
  { day: "Every Sat", time: "17:00 – 20:00", label: "Tournament",      emoji: "🏆" },
];

export default function PadelPage() {
  return (
    <div className="min-h-screen bg-[#111d16]">

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#1B3A2D] via-[#0f2419] to-[#0a1a10]">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        {/* Court lines decoration */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white" />
        </div>

        <div className="container-padella relative z-10 text-center px-6 pt-24 pb-16">
          <motion.div initial={{ opacity:0,y:-20 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.6 }}
            className="inline-flex items-center gap-2 bg-padella-gold/10 border border-padella-gold/20 px-4 py-2 rounded-full mb-6">
            <span className="text-padella-gold text-xs font-semibold tracking-[0.25em] uppercase">Padel Club Bangkok</span>
          </motion.div>

          <motion.h1 initial={{ opacity:0,y:30 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.7,delay:0.1 }}
            className="font-display font-bold text-padella-cream leading-none mb-6"
            style={{ fontSize:"clamp(3rem,9vw,7rem)", letterSpacing:"-0.03em" }}>
            Bangkok&apos;s<br /><span className="text-gradient-gold">Padel Destination</span>
          </motion.h1>

          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
            className="text-padella-cream/60 max-w-xl mx-auto text-lg mb-10 leading-relaxed">
            4 professional courts, certified Italian coaches, weekly tournaments — and the best post-match pasta in the city.
          </motion.p>

          <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.4 }}
            className="flex flex-wrap gap-4 justify-center">
            <a href="https://wa.me/66XXXXXXXXX?text=Hi%20Padella!%20I'd%20like%20to%20book%20a%20padel%20court"
              target="_blank" rel="noopener noreferrer" className="btn-primary group">
              Book a Court <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <Link href="/menu" className="btn-outline">View Menu</Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-[#0f1a14] border-y border-padella-cream/5">
        <div className="container-padella grid grid-cols-2 md:grid-cols-4 gap-6 px-6">
          {[
            { icon: Trophy, value: "4", label: "Professional Courts" },
            { icon: Clock, value: "7AM–11PM", label: "Daily Hours" },
            { icon: Users, value: "200+", label: "Active Members" },
            { icon: Trophy, value: "Weekly", label: "Tournaments" },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity:0,y:12 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} className="text-center">
              <div className="font-display font-bold text-padella-gold text-2xl md:text-3xl mb-1">{s.value}</div>
              <div className="text-padella-cream/40 text-xs">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Courts */}
      <section className="py-16 px-6">
        <div className="container-padella">
          <div className="text-center mb-10">
            <div className="text-padella-gold/60 text-xs font-semibold tracking-[0.3em] uppercase mb-3">The Courts</div>
            <h2 className="font-display font-bold text-padella-cream text-3xl md:text-4xl">4 World-Class Courts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courts.map((c, i) => (
              <motion.div key={c.num} initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.08 }}
                className={`bg-[#1a2e1f] border rounded-2xl p-6 flex gap-5 ${c.available ? "border-padella-cream/8 hover:border-padella-gold/20" : "border-padella-cream/4 opacity-60"} transition-all`}>
                <div className="font-display font-bold text-padella-gold/20 text-5xl leading-none flex-shrink-0 select-none">{c.num}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-padella-cream font-semibold text-sm">{c.type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.available ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                      {c.available ? "Available" : "Maintenance"}
                    </span>
                  </div>
                  <p className="text-padella-cream/45 text-xs leading-relaxed">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-16 px-6 bg-[#0f1a14]">
        <div className="container-padella">
          <div className="text-center mb-10">
            <div className="text-padella-gold/60 text-xs font-semibold tracking-[0.3em] uppercase mb-3">How to Play</div>
            <h2 className="font-display font-bold text-padella-cream text-3xl md:text-4xl">Choose Your Game</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {packages.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                className={`bg-[#1a2e1f] rounded-2xl p-7 border relative ${p.popular ? "border-padella-gold/30" : "border-padella-cream/6"}`}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-padella-gold text-padella-green text-[10px] font-bold rounded-full">Most Popular</div>}
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="font-display font-semibold text-padella-cream text-xl mb-1">{p.title}</h3>
                <div className="text-padella-gold font-bold text-2xl mb-3">{p.price} <span className="text-padella-cream/40 text-sm font-normal">{p.unit}</span></div>
                <p className="text-padella-cream/50 text-xs leading-relaxed mb-4">{p.desc}</p>
                <ul className="space-y-2 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-padella-cream/60 text-xs">
                      <CheckCircle size={12} className="text-padella-gold flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <a href={`https://wa.me/66XXXXXXXXX?text=Hi%20Padella!%20I'd%20like%20to%20book%20a%20${encodeURIComponent(p.title)}`}
                  target="_blank" rel="noopener noreferrer"
                  className={p.popular ? "btn-primary w-full justify-center !text-sm !py-2.5" : "btn-outline w-full justify-center !text-sm !py-2.5"}>
                  Book Now
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="py-16 px-6">
        <div className="container-padella max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display font-bold text-padella-cream text-3xl">Weekly Schedule</h2>
          </div>
          <div className="space-y-3">
            {schedule.map(s => (
              <div key={s.label} className="bg-[#1a2e1f] border border-padella-cream/6 rounded-xl px-5 py-4 flex items-center gap-4">
                <span className="text-2xl">{s.emoji}</span>
                <div className="flex-1">
                  <div className="text-padella-cream/80 text-sm font-semibold">{s.label}</div>
                  <div className="text-padella-cream/35 text-xs">{s.day}</div>
                </div>
                <div className="text-padella-gold text-sm font-medium">{s.time}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <a href="https://wa.me/66XXXXXXXXX?text=Hi%20Padella!%20I'd%20like%20to%20book%20a%20padel%20court"
              target="_blank" rel="noopener noreferrer" className="btn-primary">
              🎾 Book via WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
