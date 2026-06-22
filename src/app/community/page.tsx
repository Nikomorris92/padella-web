"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

const voices = [
  { name: "Marco R.", role: "Padel Member", text: "Padella changed my Bangkok life. I play padel 3x a week, eat the best pasta in the city, and my whole social circle is now the Padella community.", avatar: "🇮🇹" },
  { name: "Nadia K.", role: "Premium Member", text: "As an expat, finding a place that feels like home was priceless. The aperitivo Fridays are unmissable.", avatar: "🇫🇷" },
  { name: "James T.", role: "Elite Member", text: "The padel courts are world-class. The instructors are brilliant. But honestly the post-match pasta is why I really keep coming back.", avatar: "🇬🇧" },
  { name: "Yuki N.", role: "Community Member", text: "Sunday brunch at Padella is a ritual now. The food, the atmosphere, the people — it's perfect every single week.", avatar: "🇯🇵" },
];

const stats = [
  { value: "200+", label: "Soci attivi" },
  { value: "40+", label: "Nazionalità" },
  { value: "3", label: "Anni di community" },
  { value: "5★", label: "Google Rating" },
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
            Padella è più di un ristorante. È una comunità di persone che amano il buon cibo, lo sport e lo stile di vita italiano — nel cuore di Bangkok.
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
            <h2 className="font-display font-bold text-padella-cream text-3xl">La Vita alla Padella</h2>
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

      {/* Testimonials */}
      <section className="py-14 px-6 bg-[#0f1a14]">
        <div className="container-padella">
          <div className="text-center mb-8">
            <h2 className="font-display font-semibold text-padella-cream text-2xl">La Community Parla</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {voices.map((v, i) => (
              <motion.div key={v.name} initial={{ opacity:0,y:14 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.08 }}
                className="bg-[#1a2e1f] border border-padella-cream/6 rounded-2xl p-6">
                <p className="text-padella-cream/65 text-sm leading-relaxed italic mb-4">&ldquo;{v.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-padella-gold/15 border border-padella-gold/20 flex items-center justify-center text-lg">{v.avatar}</div>
                  <div>
                    <div className="text-padella-cream/80 text-xs font-semibold">{v.name}</div>
                    <div className="text-padella-cream/30 text-[10px]">{v.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter + join */}
      <section className="py-16 px-6">
        <div className="container-padella max-w-xl mx-auto text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="font-display font-bold text-padella-cream text-2xl mb-2">Resta Connesso</h2>
          <p className="text-padella-cream/45 text-sm mb-6">Events, specials, stories and community news — directly to your inbox.</p>

          {submitted ? (
            <motion.div initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }}
              className="flex items-center justify-center gap-2 text-green-400 font-semibold">
              <Check size={18} /> Iscritto! Benvenuto nella famiglia Padella 🎉
            </motion.div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="la-tua@email.com"
                onKeyDown={e => e.key === "Enter" && submit()}
                className="flex-1 px-5 py-3 bg-[#1a2e1f] border border-padella-cream/10 rounded-full text-padella-cream placeholder-padella-cream/25 text-sm outline-none focus:border-padella-gold/40 transition-colors" />
              <button onClick={submit} className="btn-primary !py-3 !px-6 whitespace-nowrap">
                Iscriviti <ArrowRight size={14} />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <a href="https://wa.me/66993741930" target="_blank" rel="noopener noreferrer" className="btn-primary justify-center">
              💬 WhatsApp Community
            </a>
            <a href="https://line.me/ti/p/XXXXXXXX" target="_blank" rel="noopener noreferrer" className="btn-outline justify-center">
              💚 Follow su LINE
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
