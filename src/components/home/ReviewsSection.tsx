"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Star } from "lucide-react";

const reviews = [
  { author: "Marco B.", avatar: "🇮🇹", rating: 5, text: "Finally, real Italian food in Bangkok! The Tagliatelle al Ragù brought me straight back to Bologna. The padel courts are top notch too — best afternoon we've had in Bangkok!", date: "2 weeks ago" },
  { author: "Sophie L.", avatar: "🇫🇷", rating: 5, text: "Absolutely stunning place. The pool is gorgeous, the cocktails are perfect and the pizza is the best I've had outside Italy. This is our new weekend spot!", date: "1 month ago" },
  { author: "James K.", avatar: "🇬🇧", rating: 5, text: "We played padel in the morning, had a long lunch by the pool, and finished with the best Tiramisù in Asia. An experience that goes beyond a restaurant.", date: "3 weeks ago" },
  { author: "Chiara M.", avatar: "🇮🇹", rating: 5, text: "Come italiana, ero scettica... ma mi hanno convinto! La burrata era freschissima, il servizio caldo come in Italia. Questo posto ha capito l'anima italiana.", date: "1 week ago" },
  { author: "Tanakorn P.", avatar: "🇹🇭", rating: 5, text: "Best Italian restaurant in Bangkok, no competition. We celebrate every family birthday here. Kids love the pizza, parents love the wine and atmosphere.", date: "2 months ago" },
  { author: "Alex W.", avatar: "🇺🇸", rating: 5, text: "The aperitivo at sunset by the pool is simply magic. Aperol Spritz in hand, great music, beautiful people. Padella gets the Italian lifestyle right.", date: "3 weeks ago" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} size={13} className="text-padella-gold fill-padella-gold" />
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} className="py-section bg-padella-green relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.015]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, #F5EFE0, #F5EFE0 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #F5EFE0, #F5EFE0 1px, transparent 1px, transparent 60px)" }}
      />

      <div className="container-padella relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-14"
        >
          <div className="section-label mb-3 justify-center">
            <span className="w-8 h-px bg-padella-gold/50" /> What Our Guests Say <span className="w-8 h-px bg-padella-gold/50" />
          </div>
          <h2 className="font-display font-bold text-padella-cream mb-2" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            <span className="text-gradient-gold">4.9 ★</span> on Google
          </h2>
          <p className="text-padella-cream/50 text-sm">Over 500+ verified reviews</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((r, i) => (
            <motion.div
              key={r.author}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="card-premium p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-padella-green rounded-full flex items-center justify-center text-xl">{r.avatar}</div>
                  <div>
                    <div className="text-padella-cream font-semibold text-sm">{r.author}</div>
                    <div className="text-padella-cream/40 text-xs">{r.date}</div>
                  </div>
                </div>
                <div className="text-padella-cream/30 text-xs">Google</div>
              </div>
              <Stars rating={r.rating} />
              <p className="text-padella-cream/65 text-sm leading-relaxed mt-3">{r.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-10"
        >
          <a
            href="https://g.page/r/XXXXXXXX/review"
            target="_blank" rel="noopener noreferrer"
            className="btn-outline inline-flex"
          >
            Write a Review on Google
          </a>
        </motion.div>
      </div>
    </section>
  );
}
