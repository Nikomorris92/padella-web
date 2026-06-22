"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

// Live reviews come from Google Maps. Click the link below to read all real ones.
const GOOGLE_REVIEWS_URL = "https://share.google/iurprWxebsgDmDMYG";

const stats = [
  { value: "—", label: "Active Members" },
  { value: "—", label: "Nationalities" },
  { value: "New", label: "Just opened" },
  { value: "★", label: "Google Rating", link: GOOGLE_REVIEWS_URL },
];

export default function CommunityPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!email.includes("@")) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#111d16]">

      {/* Hero */}
      <section className="relative py-32 px-6 text-center overflow-hidden bg-gradient-to-br from-[#1B3A2D] via-[#0f2419] to-[#111d16]">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, rgba(201,168,76,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <motion.div initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.7 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-padella-gold/10 border border-padella-gold/20 px-4 py-2 rounded-full mb-6">
            <span className="text-padella-gold text-xs font-semibold tracking-[0.25em] uppercase">Community</span>
          </div>
          <h1 className="font-display font-bold text-padella-cream leading-none mb-5"
            style={{ fontSize:"clamp(3rem,9vw,7rem)", letterSpacing:"-0.03em" }}>
            Join the<br /><span className="text-gradient-gold">Padella Family</span>
          </h1>
          <p className="text-padella-cream/55 max-w-2xl mx-auto text-lg leading-relaxed">
            Padella is more than a restaurant. It is a community of people who love great food, sport and the Italian lifestyle — in the heart of Bangkok.
          </p>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-[#0f1a14] border-y border-padella-cream/5">
        <div className="container-padella grid grid-cols-2 md:grid-cols-4 gap-6 px-6">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity:0,y:12 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.07 }} className="text-center">
              <div className="font-display font-bold text-padella-gold text-3xl mb-1">{s.value}</div>
              <div className="text-padella-cream/35 text-xs">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What we do */}
      <section className="py-16 px-6">
        <div className="container-padella">
          <div className="text-center mb-10">
            <h2 className="font-display font-bold text-padella-cream text-3xl">Life at Padella</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { emoji: "🎾", title: "Padel Leagues", desc: "Weekly leagues where friendships and rivalries are born on court." },
              { emoji: "🍹", title: "Aperitivo Fridays", desc: "End the week the Italian way — spritz, bruschette, good company." },
              { emoji: "🥐", title: "Sunday Brunch Crew", desc: "A weekly ritual for the regulars. The best Sunday in Bangkok." },
              { emoji: "🎵", title: "Music Events", desc: "DJ nights, live sets, and private listening parties." },
              { emoji: "🏊", title: "Pool Tribe", desc: "Morning swims, afternoon hangs, sunset cocktails. Daily pool regulars." },
              { emoji: "🌍", title: "International Mix", desc: "40+ nationalities. One language: food, sport, and Italian lifestyle." },
            ].map((c, i) => (
              <motion.div key={c.title} initial={{ opacity:0,y:16 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.07 }}
                className="bg-[#1a2e1f] border border-padella-cream/6 hover:border-padella-gold/15 rounded-2xl p-6 transition-all">
                <div className="text-4xl mb-3">{c.emoji}</div>
                <h3 className="font-semibold text-padella-cream text-sm mb-1">{c.title}</h3>
                <p className="text-padella-cream/40 text-xs leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Google Reviews — link out */}
      <section className="py-14 px-6 bg-[#0f1a14]">
        <div className="container-padella max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-padella-gold/10 border border-padella-gold/20 px-4 py-2 rounded-full mb-5">
            <span className="text-padella-gold text-xs font-semibold tracking-[0.25em] uppercase">Reviews</span>
          </div>
          <h2 className="font-display font-semibold text-padella-cream text-2xl mb-3">What our guests say on Google</h2>
          <p className="text-padella-cream/55 text-sm leading-relaxed mb-7">
            We just opened our doors. Real reviews from our first guests are published on Google Maps — check them out and leave yours after your visit.
          </p>
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank" rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            ⭐ Read & Write Reviews on Google
          </a>
        </div>
      </section>

      {/* Newsletter + join */}
      <section className="py-16 px-6">
        <div className="container-padella max-w-xl mx-auto text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="font-display font-bold text-padella-cream text-2xl mb-2">Stay Connected</h2>
          <p className="text-padella-cream/45 text-sm mb-6">Events, specials, stories and community news — directly to your inbox.</p>

          {submitted ? (
            <motion.div initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }}
              className="flex items-center justify-center gap-2 text-green-400 font-semibold">
              <Check size={18} /> Subscribed! Welcome to the Padella family 🎉
            </motion.div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                onKeyDown={e => e.key === "Enter" && submit()}
                className="flex-1 px-5 py-3 bg-[#1a2e1f] border border-padella-cream/10 rounded-full text-padella-cream placeholder-padella-cream/25 text-sm outline-none focus:border-padella-gold/40 transition-colors" />
              <button onClick={submit} className="btn-primary !py-3 !px-6 whitespace-nowrap">
                Subscribe <ArrowRight size={14} />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <a href="https://wa.me/66993741930" target="_blank" rel="noopener noreferrer" className="btn-primary justify-center">
              💬 WhatsApp Community
            </a>
            <a href="https://line.me/ti/p/XXXXXXXX" target="_blank" rel="noopener noreferrer" className="btn-outline justify-center">
              💚 Follow on LINE
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
