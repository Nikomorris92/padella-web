"use client";

import { motion } from "framer-motion";
import { CheckCircle, Star, Crown, Zap } from "lucide-react";

const plans = [
  {
    icon: Zap, name: "Padella Pass", price: "1,500", period: "/mese",
    color: "border-padella-cream/15", iconBg: "bg-padella-cream/10", iconColor: "text-padella-cream/60",
    features: ["10% su cibo & drink", "Prenotazione prioritaria campi", "Newsletter mensile", "Accesso eventi members"],
    cta: "btn-outline", badge: null,
  },
  {
    icon: Star, name: "Padella Premium", price: "3,500", period: "/mese",
    color: "border-padella-gold/35", iconBg: "bg-padella-gold/15", iconColor: "text-padella-gold",
    features: ["20% su cibo & drink", "2 ore campo gratis/mese", "Aperitivo gratuito ogni venerdì", "Accesso eventi VIP", "1 ospite gratuito", "Early access novità menu"],
    cta: "btn-primary", badge: "Più Popolare",
  },
  {
    icon: Crown, name: "Padella Elite", price: "8,000", period: "/mese",
    color: "border-padella-terracotta/35", iconBg: "bg-padella-terracotta/15", iconColor: "text-padella-terracotta",
    features: ["30% su tutto", "Accesso illimitato ai campi", "Chef's Table privato/mese", "Ospiti illimitati", "Evento di compleanno", "Servizio concierge", "Parcheggio riservato"],
    cta: "btn-outline", badge: "Best Value",
  },
];

const perks = [
  { emoji: "🎾", title: "Priorità Campi", desc: "I membri possono prenotare 7 giorni prima." },
  { emoji: "🍝", title: "Sconti F&B", desc: "Fino al 30% su tutto il menu, tutto l'anno." },
  { emoji: "🏆", title: "Tornei Esclusivi", desc: "Accesso ai tornei riservati ai soli soci." },
  { emoji: "🍹", title: "Aperitivo Gratuito", desc: "Ogni venerdì sera — incluso nel Premium." },
  { emoji: "🎵", title: "Accesso VIP", desc: "Ingresso prioritario agli eventi serali." },
  { emoji: "🎁", title: "Birthday Perks", desc: "Cena gratuita e bottiglia di vino nel mese del compleanno." },
];

export default function MembershipPage() {
  return (
    <div className="min-h-screen bg-[#111d16]">

      {/* Hero */}
      <section className="relative py-32 px-6 text-center overflow-hidden bg-gradient-to-br from-[#1B3A2D] via-[#1a1410] to-[#111d16]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(201,168,76,0.08),transparent)]" />
        <motion.div initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.7 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-padella-gold/10 border border-padella-gold/20 px-4 py-2 rounded-full mb-6">
            <Crown size={12} className="text-padella-gold" />
            <span className="text-padella-gold text-xs font-semibold tracking-[0.25em] uppercase">Membership</span>
          </div>
          <h1 className="font-display font-bold text-padella-cream leading-none mb-5"
            style={{ fontSize:"clamp(3rem,9vw,7rem)", letterSpacing:"-0.03em" }}>
            Diventa un<br /><span className="text-gradient-gold">Membro</span>
          </h1>
          <p className="text-padella-cream/55 max-w-xl mx-auto text-lg leading-relaxed">
            Benefici esclusivi, accesso prioritario, sconti tutto l&apos;anno e la migliore comunità italiana di Bangkok.
          </p>
        </motion.div>
      </section>

      {/* Perks */}
      <section className="py-14 px-6 bg-[#0f1a14]">
        <div className="container-padella">
          <div className="text-center mb-8">
            <h2 className="font-display font-semibold text-padella-cream text-2xl">Cosa Ottieni</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {perks.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity:0,y:14 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.07 }}
                className="bg-[#1a2e1f] border border-padella-cream/6 rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{p.emoji}</span>
                <div>
                  <div className="text-padella-cream/80 text-xs font-semibold mb-0.5">{p.title}</div>
                  <div className="text-padella-cream/35 text-[11px] leading-relaxed">{p.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 px-6">
        <div className="container-padella">
          <div className="text-center mb-10">
            <h2 className="font-display font-bold text-padella-cream text-3xl mb-2">Scegli il Tuo Piano</h2>
            <p className="text-padella-cream/40 text-sm">Nessun contratto. Cancella quando vuoi.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {plans.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity:0,y:24 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                className={`bg-[#1a2e1f] rounded-2xl p-7 border relative flex flex-col ${p.color}`}>
                {p.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold rounded-full whitespace-nowrap ${p.badge === "Più Popolare" ? "bg-padella-gold text-padella-green" : "bg-padella-terracotta text-white"}`}>
                    {p.badge}
                  </div>
                )}
                <div className={`w-10 h-10 ${p.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  <p.icon size={18} className={p.iconColor} />
                </div>
                <h3 className="font-display font-semibold text-padella-cream text-xl mb-1">{p.name}</h3>
                <div className="text-padella-gold font-bold text-3xl mb-4">
                  {p.price} <span className="text-padella-cream/30 text-base font-normal">THB{p.period}</span>
                </div>
                <div className="w-10 h-px bg-padella-gold/20 mb-4" />
                <ul className="space-y-2.5 flex-1 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-padella-cream/60 text-xs">
                      <CheckCircle size={12} className="text-padella-gold flex-shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <a href={`https://wa.me/66993741930?text=Hi%20Padella!%20I'd%20like%20to%20join%20${encodeURIComponent(p.name)}`}
                  target="_blank" rel="noopener noreferrer"
                  className={`${p.cta} justify-center !text-sm !py-3`}>
                  Inizia Ora
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ strip */}
      <section className="py-12 px-6 bg-[#0f1a14]">
        <div className="container-padella max-w-2xl mx-auto space-y-3">
          {[
            { q: "Posso cancellare in qualsiasi momento?", a: "Sì — nessun contratto, nessuna penale. Cancella con 30 giorni di preavviso." },
            { q: "La membership include anche la piscina?", a: "Sì, i piani Premium ed Elite includono accesso libero alla piscina." },
            { q: "Posso regalare una membership?", a: "Assolutamente — contattaci su WhatsApp per i gift cards." },
          ].map(f => (
            <div key={f.q} className="bg-[#1a2e1f] border border-padella-cream/6 rounded-xl p-5">
              <div className="text-padella-cream/80 text-sm font-semibold mb-1">{f.q}</div>
              <div className="text-padella-cream/40 text-xs leading-relaxed">{f.a}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
