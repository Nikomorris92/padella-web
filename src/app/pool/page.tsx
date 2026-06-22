"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";

const features = [
  { emoji: "🏊", title: "25m Heated Pool", desc: "Mediterranean-inspired design with crystal-clear water, heated year-round to 28°C." },
  { emoji: "🛖", title: "Private Cabanas", desc: "6 exclusive day cabanas with sunbeds, shade canopy, towels, and poolside service." },
  { emoji: "🍹", title: "Pool Bar", desc: "Full cocktail bar — Aperol Spritz, Negroni, fresh smoothies, and Italian wines." },
  { emoji: "🎵", title: "Ambient Music", desc: "Curated Italian house and lounge sets all day. Live DJ on selected Saturdays." },
  { emoji: "🍕", title: "Poolside Menu", desc: "Light bites, panini and antipasti delivered directly to your sunbed." },
  { emoji: "🌅", title: "Sunset Hour", desc: "Golden hour aperitivo by the pool — the most beautiful moment in Bangkok." },
];

const cabanas = [
  { name: "Standard Cabana", price: "1,500", unit: "THB / day", features: ["2 sunbeds", "Towels included", "Poolside service", "Welcome drink"] },
  { name: "Premium Cabana", price: "2,800", unit: "THB / day", features: ["4 sunbeds", "Mini fridge", "Dedicated waiter", "Bottle of Prosecco", "Fruit platter"], popular: true },
  { name: "Pool Suite", price: "5,500", unit: "THB / day", features: ["Private terrace", "Full F&B credit 1,500 THB", "Champagne on arrival", "Priority service", "Up to 6 guests"] },
];

export default function PoolPage() {
  return (
    <div className="min-h-screen bg-[#111d16]">

      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0d2d40] via-[#1B3A2D] to-[#0a1a10]">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#111d16] to-transparent" />

        <div className="container-padella relative z-10 text-center px-6 pt-24 pb-20">
          <motion.div initial={{ opacity:0,y:-16 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.6 }}
            className="inline-flex items-center gap-2 bg-blue-400/10 border border-blue-400/20 px-4 py-2 rounded-full mb-6">
            <span className="text-blue-300 text-xs font-semibold tracking-[0.25em] uppercase">Pool & Lounge</span>
          </motion.div>

          <motion.h1 initial={{ opacity:0,y:30 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.7,delay:0.1 }}
            className="font-display font-bold text-padella-cream leading-none mb-6"
            style={{ fontSize:"clamp(3rem,9vw,7rem)", letterSpacing:"-0.03em" }}>
            Your<br /><span className="text-gradient-gold">Mediterranean Escape</span>
          </motion.h1>

          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
            className="text-padella-cream/60 max-w-xl mx-auto text-lg mb-10 leading-relaxed">
            Dive into the Italian Riviera spirit without leaving Bangkok. Sunbeds, cocktails and la dolce vita — just for you.
          </motion.p>

          <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.4 }}
            className="flex flex-wrap gap-4 justify-center">
            <a href="https://wa.me/66993741930?text=Hi%20Padella!%20I'd%20like%20to%20reserve%20a%20pool%20cabana"
              target="_blank" rel="noopener noreferrer" className="btn-primary group">
              Reserve a Cabana <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="https://wa.me/66993741930?text=Hi%20Padella!%20What%20are%20the%20pool%20hours?"
              target="_blank" rel="noopener noreferrer" className="btn-outline">Pool Hours</a>
          </motion.div>
        </div>
      </section>

      {/* Hours banner */}
      <section className="py-6 bg-[#0f1a14] border-y border-padella-cream/5">
        <div className="container-padella flex flex-wrap items-center justify-center gap-8 px-6">
          {[
            { label: "Pool Open", value: "10:00 – 21:00" },
            { label: "Pool Bar", value: "10:00 – 22:00" },
            { label: "Aperitivo Hour", value: "17:00 – 19:00" },
          ].map(h => (
            <div key={h.label} className="text-center">
              <div className="text-padella-gold font-bold text-lg">{h.value}</div>
              <div className="text-padella-cream/35 text-xs">{h.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 px-6">
        <div className="container-padella">
          <div className="text-center mb-10">
            <div className="text-padella-gold/60 text-xs font-semibold tracking-[0.3em] uppercase mb-3">The Experience</div>
            <h2 className="font-display font-bold text-padella-cream text-3xl md:text-4xl">Everything You Need</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.07 }}
                className="bg-[#1a2e1f] border border-padella-cream/6 hover:border-padella-gold/15 rounded-2xl p-6 transition-all group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{f.emoji}</div>
                <h3 className="font-semibold text-padella-cream text-sm mb-1">{f.title}</h3>
                <p className="text-padella-cream/45 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cabanas */}
      <section className="py-16 px-6 bg-[#0f1a14]">
        <div className="container-padella">
          <div className="text-center mb-10">
            <div className="text-padella-gold/60 text-xs font-semibold tracking-[0.3em] uppercase mb-3">Reserve Your Space</div>
            <h2 className="font-display font-bold text-padella-cream text-3xl md:text-4xl">Private Cabanas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {cabanas.map((c, i) => (
              <motion.div key={c.name} initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                className={`bg-[#1a2e1f] rounded-2xl p-6 border relative ${c.popular ? "border-padella-gold/30" : "border-padella-cream/6"}`}>
                {c.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-padella-gold text-padella-green text-[10px] font-bold rounded-full">Best Choice</div>}
                <h3 className="font-display font-semibold text-padella-cream text-lg mb-1">{c.name}</h3>
                <div className="text-padella-gold font-bold text-2xl mb-4">{c.price} <span className="text-padella-cream/35 text-sm font-normal">{c.unit}</span></div>
                <ul className="space-y-2 mb-6">
                  {c.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-padella-cream/55 text-xs">
                      <CheckCircle size={11} className="text-padella-gold flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <a href="https://wa.me/66993741930?text=Hi%20Padella!%20I'd%20like%20to%20reserve%20a%20cabana"
                  target="_blank" rel="noopener noreferrer"
                  className={c.popular ? "btn-primary w-full justify-center !text-sm !py-2.5" : "btn-outline w-full justify-center !text-sm !py-2.5"}>
                  Reserve Now
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center">
        <h2 className="font-display font-bold text-padella-cream text-2xl mb-3">Pool Access without Cabana</h2>
        <p className="text-padella-cream/50 text-sm mb-6 max-w-sm mx-auto">Day pass available — includes pool access and a welcome drink. Members get free access.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a href="https://wa.me/66993741930?text=Hi%20Padella!%20I'd%20like%20a%20pool%20day%20pass"
            target="_blank" rel="noopener noreferrer" className="btn-primary">💬 Day Pass — 400 THB</a>
        </div>
      </section>
    </div>
  );
}
