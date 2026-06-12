"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SAMPLE_MENU } from "@/lib/menuData";

const featured = SAMPLE_MENU.filter(item =>
  ["p1", "pz3", "s1", "c1", "d1", "m1"].includes(item.id)
);

function MenuCard({ item, delay }: { item: typeof featured[0]; delay: number }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6 }}
      className="card-premium overflow-hidden group cursor-pointer"
    >
      {/* Image placeholder with gradient */}
      <div className="relative h-52 bg-gradient-to-br from-padella-green-muted to-padella-charcoal overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">
          {item.category === "pasta" ? "🍝" : item.category === "pizza" ? "🍕" :
           item.category === "starter" ? "🫒" : item.category === "cocktails" ? "🍹" :
           item.category === "dessert" ? "🍮" : "🥩"}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-padella-green-light/80 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {item.isNew && (
            <span className="px-2 py-1 bg-padella-gold text-padella-green text-[10px] font-bold tracking-wide rounded-full">NEW</span>
          )}
          {item.isSpecial && (
            <span className="px-2 py-1 bg-padella-terracotta text-white text-[10px] font-bold tracking-wide rounded-full">SIGNATURE</span>
          )}
          {item.isVegetarian && (
            <span className="px-2 py-1 bg-green-600/80 text-white text-[10px] font-bold tracking-wide rounded-full">VEG</span>
          )}
        </div>

        <div className="absolute bottom-3 right-3 bg-padella-gold/90 text-padella-green text-sm font-bold px-3 py-1 rounded-full">
          {item.price} {item.currency}
        </div>
      </div>

      <div className="p-5">
        <div className="text-padella-gold/60 text-[10px] font-semibold tracking-[0.2em] uppercase mb-1">
          {item.category.replace("-", " ")}
        </div>
        <h3 className="font-display font-semibold text-padella-cream text-lg mb-2 group-hover:text-padella-gold transition-colors">
          {item.name}
        </h3>
        <p className="text-padella-cream/50 text-sm leading-relaxed line-clamp-2">{item.description}</p>
      </div>
    </motion.div>
  );
}

export default function MenuPreview() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} className="py-section bg-padella-green-light/30 relative">
      <div className="container-padella">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
        >
          <div>
            <div className="section-label mb-3">
              <span className="w-8 h-px bg-padella-gold/50" /> From the Kitchen
            </div>
            <h2 className="font-display font-bold text-padella-cream" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              Taste of <span className="text-gradient-gold">Italy</span>
            </h2>
          </div>
          <Link href="/menu" className="btn-ghost !text-padella-gold group self-start md:self-auto">
            Full Menu <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((item, i) => (
            <MenuCard key={item.id} item={item} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
}
