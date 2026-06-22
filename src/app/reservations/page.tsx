"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin, Phone } from "lucide-react";

const services = [
  { emoji: "🍝", label: "Restaurant Table", msg: "Hi Padella! I'd like to reserve a table for " },
  { emoji: "🎾", label: "Padel Court",       msg: "Hi Padella! I'd like to book a padel court for " },
  { emoji: "🏊", label: "Pool Cabana",        msg: "Hi Padella! I'd like to reserve a pool cabana for " },
  { emoji: "🎉", label: "Private Event",      msg: "Hi Padella! I'd like to enquire about a private event for " },
];

const hours = [
  { slot: "Colazione", time: "07:00 – 11:00", emoji: "🌅" },
  { slot: "Pranzo",    time: "11:00 – 15:00", emoji: "☀️" },
  { slot: "Aperitivo", time: "18:00 – 20:00", emoji: "🍹" },
  { slot: "Cena",      time: "20:00 – 24:00", emoji: "🌙" },
];

export default function ReservationsPage() {
  const [pax, setPax] = useState("2");
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState(0);

  const buildMsg = () => {
    const s = services[selected];
    return encodeURIComponent(`${s.msg}${pax} people${date ? ` on ${date}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-[#111d16]">

      {/* Hero */}
      <section className="relative py-32 px-6 bg-gradient-to-br from-[#1B3A2D] via-[#0f2419] to-[#111d16] text-center">
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.7 }}>
          <div className="inline-flex items-center gap-2 bg-padella-gold/10 border border-padella-gold/20 px-4 py-2 rounded-full mb-6">
            <span className="text-padella-gold text-xs font-semibold tracking-[0.25em] uppercase">Reservations</span>
          </div>
          <h1 className="font-display font-bold text-padella-cream leading-none mb-6"
            style={{ fontSize:"clamp(2.8rem,8vw,6rem)", letterSpacing:"-0.03em" }}>
            Book Your<br /><span className="text-gradient-gold">Experience</span>
          </h1>
          <p className="text-padella-cream/55 max-w-md mx-auto text-lg leading-relaxed">
            Table, court, or cabana — reserve in seconds via WhatsApp. We reply in under 5 minutes.
          </p>
        </motion.div>
      </section>

      {/* Quick Book */}
      <section className="py-16 px-6">
        <div className="container-padella max-w-2xl mx-auto">
          <div className="bg-[#1a2e1f] border border-padella-gold/15 rounded-3xl p-6 md:p-8">
            <h2 className="font-display font-semibold text-padella-cream text-xl mb-6">Quick Booking</h2>

            {/* Service selector */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {services.map((s, i) => (
                <button key={s.label} onClick={() => setSelected(i)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${i === selected ? "bg-padella-gold/15 border-padella-gold/30 text-padella-cream" : "bg-[#0f1a14] border-padella-cream/8 text-padella-cream/50 hover:border-padella-cream/20"}`}>
                  <span className="text-xl">{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>

            {/* Pax + Date */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="text-padella-cream/40 text-[10px] uppercase tracking-wide font-semibold block mb-1.5">Persone</label>
                <select value={pax} onChange={e => setPax(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f1a14] border border-padella-cream/10 rounded-xl text-padella-cream text-sm outline-none focus:border-padella-gold/40">
                  {["1","2","3","4","5","6","7","8","10","12","15","20+"].map(n => <option key={n} value={n}>{n} {parseInt(n) === 1 ? "persona" : "persone"}</option>)}
                </select>
              </div>
              <div>
                <label className="text-padella-cream/40 text-[10px] uppercase tracking-wide font-semibold block mb-1.5">Data</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0f1a14] border border-padella-cream/10 rounded-xl text-padella-cream text-sm outline-none focus:border-padella-gold/40" />
              </div>
            </div>

            {/* WhatsApp / LINE */}
            <div className="flex flex-col gap-2">
              <a href={`https://wa.me/66993741930?text=${buildMsg()}`}
                target="_blank" rel="noopener noreferrer"
                className="btn-primary justify-center group">
                💬 Book via WhatsApp <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="https://line.me/ti/p/XXXXXXXX"
                target="_blank" rel="noopener noreferrer"
                className="btn-outline justify-center !py-3">
                💚 Book via LINE
              </a>
            </div>
            <p className="text-center text-padella-cream/25 text-[11px] mt-3">Average reply time: under 5 minutes · 10:00–22:00</p>
          </div>
        </div>
      </section>

      {/* Opening hours */}
      <section className="py-12 px-6 bg-[#0f1a14]">
        <div className="container-padella max-w-2xl mx-auto">
          <h2 className="font-display font-semibold text-padella-cream text-xl mb-5 flex items-center gap-2">
            <Clock size={18} className="text-padella-gold" /> Opening Hours
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {hours.map(h => (
              <div key={h.slot} className="bg-[#1a2e1f] border border-padella-cream/6 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">{h.emoji}</span>
                <div>
                  <div className="text-padella-cream/80 text-sm font-semibold">{h.slot}</div>
                  <div className="text-padella-gold text-xs">{h.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location + contact */}
      <section className="py-12 px-6">
        <div className="container-padella max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#1a2e1f] border border-padella-cream/6 rounded-xl p-5">
            <MapPin size={16} className="text-padella-gold mb-3" />
            <div className="text-padella-cream font-semibold text-sm mb-1">Find Us</div>
            <div className="text-padella-cream/45 text-xs leading-relaxed">123 Sukhumvit Soi XX<br />Watthana, Bangkok 10110</div>
            <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer"
              className="text-padella-gold/70 hover:text-padella-gold text-xs mt-2 block transition-colors">Get Directions →</a>
          </div>
          <div className="bg-[#1a2e1f] border border-padella-cream/6 rounded-xl p-5">
            <Phone size={16} className="text-padella-gold mb-3" />
            <div className="text-padella-cream font-semibold text-sm mb-1">Contact</div>
            <div className="text-padella-cream/45 text-xs space-y-1">
              <div>📞 +66 063 486 4626</div>
              <div>💬 WhatsApp: +66 063 486 4626</div>
              <div>💚 LINE: @padella.bkk</div>
              <div>✉️ info@padella.bkk</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
