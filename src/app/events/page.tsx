"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";

const EVENTS = [
  { id: 1, emoji: "🍹", cat: "aperitivo", title: "Aperitivo Italiano",   day: "Ogni Venerdì",   time: "18:00 – 20:00", price: "Free entry", desc: "Live music, Aperol Spritz, bruschette e la miglior compagnia di Bangkok.", spots: null },
  { id: 2, emoji: "🏆", cat: "padel",     title: "Padel Tournament",     day: "Ogni Sabato",    time: "14:00 – 19:00", price: "300 THB",    desc: "Open to all levels. Mixed doubles format. Trophy + dinner for winners.", spots: 16 },
  { id: 3, emoji: "🎵", cat: "music",     title: "DJ Set Night",         day: "Sabato 21 Giu",  time: "21:00 – Late",  price: "200 THB",    desc: "Italian house and Mediterranean vibes. Cocktails and dancing under the stars.", spots: 80 },
  { id: 4, emoji: "🥐", cat: "food",      title: "Sunday Italian Brunch",day: "Ogni Domenica",  time: "10:00 – 14:00", price: "550 THB",    desc: "Cornetto, Prosecco, antipasti and fresh pasta. The most Italian Sunday in BKK.", spots: null },
  { id: 5, emoji: "🎾", cat: "padel",     title: "Beginner Clinic",      day: "Mer 18 Giu",     time: "09:00 – 11:00", price: "400 THB",    desc: "Never played padel? This is the perfect introduction. Small group, certified coach.", spots: 8 },
  { id: 6, emoji: "🏊", cat: "pool",      title: "Pool Party",           day: "Sab 28 Giu",     time: "15:00 – 21:00", price: "350 THB",    desc: "DJ by the pool, cocktails, food stalls. The summer event of the year.", spots: 120 },
  { id: 7, emoji: "🍷", cat: "food",      title: "Wine Dinner",          day: "Gio 19 Giu",     time: "19:00 – 23:00", price: "1,800 THB",  desc: "5 courses paired with Italian wines. Guest sommelier. Limited seats.", spots: 20 },
  { id: 8, emoji: "🏆", cat: "padel",     title: "Monthly Open Tournament", day: "Dom 29 Giu", time: "08:00 – 18:00", price: "500 THB",    desc: "Our biggest monthly event. All levels, cash prizes, full-day food & drinks.", spots: 32 },
];

const CATS = ["all","aperitivo","padel","food","pool","music"] as const;
type Cat = typeof CATS[number];

const CAT_LABEL: Record<Cat,string> = { all:"All Events", aperitivo:"🍹 Aperitivo", padel:"🎾 Padel", food:"🍝 Food", pool:"🏊 Pool", music:"🎵 Music" };

export default function EventsPage() {
  const [cat, setCat] = useState<Cat>("all");

  const filtered = cat === "all" ? EVENTS : EVENTS.filter(e => e.cat === cat);

  return (
    <div className="min-h-screen bg-[#111d16]">

      {/* Hero */}
      <section className="relative py-32 px-6 bg-gradient-to-br from-[#2a1a0f] via-[#1B3A2D] to-[#111d16] text-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)", backgroundSize: "50px 50px" }} />
        <motion.div initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.7 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-padella-gold/10 border border-padella-gold/20 px-4 py-2 rounded-full mb-6">
            <Calendar size={12} className="text-padella-gold" />
            <span className="text-padella-gold text-xs font-semibold tracking-[0.25em] uppercase">Events & Calendar</span>
          </div>
          <h1 className="font-display font-bold text-padella-cream leading-none mb-5"
            style={{ fontSize:"clamp(3rem,9vw,7rem)", letterSpacing:"-0.03em" }}>
            What&apos;s <span className="text-gradient-gold">On</span>
          </h1>
          <p className="text-padella-cream/55 max-w-lg mx-auto text-lg leading-relaxed">
            Padel tournaments, aperitivo nights, DJ sets, pool parties and Sunday brunches. Something for everyone, every week.
          </p>
        </motion.div>
      </section>

      {/* Filter */}
      <section className="py-8 px-6 bg-[#0f1a14] border-b border-padella-cream/5 sticky top-0 z-20 backdrop-blur-xl">
        <div className="container-padella flex gap-2 overflow-x-auto scrollbar-hide justify-center">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${cat === c ? "bg-padella-gold text-padella-green" : "bg-[#1a2e1f] text-padella-cream/50 hover:text-padella-cream/80 border border-padella-cream/8"}`}>
              {CAT_LABEL[c]}
            </button>
          ))}
        </div>
      </section>

      {/* Events grid */}
      <section className="py-12 px-6">
        <div className="container-padella">
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((ev, i) => (
                <motion.div key={ev.id} layout initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,scale:0.95 }} transition={{ delay:i*0.06 }}
                  className="bg-[#1a2e1f] border border-padella-cream/6 hover:border-padella-gold/20 rounded-2xl p-6 flex flex-col group transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl">{ev.emoji}</span>
                    <span className="text-padella-gold font-bold text-sm">{ev.price}</span>
                  </div>
                  <h3 className="font-display font-semibold text-padella-cream text-lg mb-1 group-hover:text-padella-gold transition-colors">{ev.title}</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-padella-cream/50 text-xs">{ev.day}</span>
                    <span className="text-padella-cream/20 text-xs">·</span>
                    <span className="text-padella-cream/50 text-xs">{ev.time}</span>
                  </div>
                  <p className="text-padella-cream/45 text-xs leading-relaxed flex-1 mb-4">{ev.desc}</p>
                  <div className="flex items-center justify-between">
                    {ev.spots !== null ? (
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${ev.spots <= 10 ? "bg-red-500/15 text-red-400" : "bg-green-500/10 text-green-400/80"}`}>
                        {ev.spots} spots left
                      </span>
                    ) : <span className="text-[10px] text-padella-cream/20">Open entry</span>}
                    <a href={`https://wa.me/66XXXXXXXXX?text=Hi%20Padella!%20I'd%20like%20to%20join%20${encodeURIComponent(ev.title)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-padella-gold/60 hover:text-padella-gold text-xs font-semibold flex items-center gap-1 transition-colors group-hover:gap-2">
                      Book <ArrowRight size={11} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      </section>

      {/* Private events */}
      <section className="py-14 px-6 bg-[#0f1a14]">
        <div className="container-padella max-w-2xl mx-auto text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="font-display font-bold text-padella-cream text-2xl mb-3">Private & Corporate Events</h2>
          <p className="text-padella-cream/50 text-sm mb-6 leading-relaxed">
            Padella is the perfect venue for birthdays, corporate dinners, product launches and team events. We handle everything — venue, food, entertainment.
          </p>
          <a href="https://wa.me/66XXXXXXXXX?text=Hi%20Padella!%20I'd%20like%20to%20enquire%20about%20a%20private%20event"
            target="_blank" rel="noopener noreferrer" className="btn-primary">
            💬 Enquire About Private Events
          </a>
        </div>
      </section>
    </div>
  );
}
