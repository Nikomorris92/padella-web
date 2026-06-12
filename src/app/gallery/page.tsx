"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";

const CATS = ["all","food","drinks","padel","pool"] as const;
type GalCat = typeof CATS[number];

const items = [
  { id:1,  cat:"food"  as GalCat, label:"Tagliere di Salumi",    img:"/images/food/tagliere-salumi.jpg",      real:true },
  { id:2,  cat:"food"  as GalCat, label:"Pizza con Uovo e Bacon",img:"/images/food/pizza-uovo-bacon.jpg",     real:true },
  { id:3,  cat:"food"  as GalCat, label:"Pizza Salsiccia",       img:"/images/food/pizza-salsiccia.jpg",      real:true },
  { id:4,  cat:"food"  as GalCat, label:"Bruschetta Pomodori",   img:"/images/food/bruschetta-pomodori.jpg",  real:true },
  { id:5,  cat:"food"  as GalCat, label:"Bruschetta Ardesia",    img:"/images/food/bruschetta-ardesia.jpg",   real:true },
  { id:6,  cat:"food"  as GalCat, label:"Burrata e Rucola",      img:"/images/food/burrata-rucola.jpg",       real:true },
  { id:7,  cat:"food"  as GalCat, label:"Mozzarella e Rosmarino",img:"/images/food/mozzarella-rosmarino.jpg", real:true },
  { id:8,  cat:"food"  as GalCat, label:"Panino con Rucola",     img:"/images/food/panino-rucola.jpg",        real:true },
  { id:9,  cat:"food"  as GalCat, label:"Panino Tostato",        img:"/images/food/panino-tostato.jpg",       real:true },
  { id:10, cat:"food"  as GalCat, label:"Tagliere Misto",        img:"/images/food/tagliere-misto.jpg",       real:true },
  { id:11, cat:"food"  as GalCat, label:"Bruschette Formaggio",  img:"/images/food/bruschette-formaggio.jpg", real:true },
  { id:12, cat:"food"  as GalCat, label:"Colazione",             img:"/images/food/muffin-colazione.jpg",     real:true },
  { id:13, cat:"food"  as GalCat, label:"Frutta Fresca",         img:"/images/food/frutta-fresca.png",        real:true },
  { id:14, cat:"padel" as GalCat, label:"Thai Padel Series",     img:"/images/padel/thai-padel-series.jpg",   real:true },
  { id:15, cat:"padel" as GalCat, label:"Padel Player",          img:"/images/padel/padel-player.jpg",        real:true },
  // Placeholders
  { id:16, cat:"drinks"as GalCat, label:"Aperol Spritz",         img:null, emoji:"🍹", real:false },
  { id:17, cat:"drinks"as GalCat, label:"Negroni Bianco",        img:null, emoji:"🍸", real:false },
  { id:18, cat:"pool"  as GalCat, label:"Pool Sunset",           img:null, emoji:"🏊", real:false },
  { id:19, cat:"pool"  as GalCat, label:"Cabana Time",           img:null, emoji:"🛖", real:false },
  { id:20, cat:"padel" as GalCat, label:"Tournament Day",        img:null, emoji:"🏆", real:false },
];

const HEIGHTS = ["h-56","h-64","h-48","h-72","h-56","h-60","h-64","h-52","h-68","h-56","h-60","h-48","h-64","h-72","h-56","h-60","h-48","h-56","h-64","h-52"];

export default function GalleryPage() {
  const [active, setActive] = useState<GalCat>("all");
  const [lightbox, setLightbox] = useState<typeof items[number] | null>(null);

  const filtered = active === "all" ? items : items.filter(i => i.cat === active);

  return (
    <div className="min-h-screen bg-[#111d16]">

      {/* Hero */}
      <section className="pt-28 pb-12 px-6 text-center bg-gradient-to-b from-[#1B3A2D] to-[#111d16]">
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.6 }}>
          <div className="inline-flex items-center gap-2 bg-padella-gold/10 border border-padella-gold/20 px-4 py-2 rounded-full mb-4">
            <span className="text-padella-gold text-xs font-semibold tracking-[0.25em] uppercase">Gallery</span>
          </div>
          <h1 className="font-display font-bold text-padella-cream leading-none"
            style={{ fontSize:"clamp(3rem,8vw,6rem)", letterSpacing:"-0.03em" }}>
            Life at <span className="text-gradient-gold italic">Padella</span>
          </h1>
        </motion.div>
      </section>

      {/* Filter */}
      <div className="flex gap-2 justify-center flex-wrap px-6 mb-8">
        {CATS.map(c => (
          <button key={c} onClick={() => setActive(c)}
            className={`px-5 py-2 rounded-full text-xs font-semibold capitalize transition-all ${active === c ? "bg-padella-gold text-padella-green" : "bg-[#1a2e1f] border border-padella-cream/8 text-padella-cream/50 hover:text-padella-cream/80"}`}>
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      {/* Masonry grid */}
      <div className="container-padella px-6 pb-16">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
          <AnimatePresence>
            {filtered.map((item, i) => (
              <motion.div key={item.id} layout initial={{ opacity:0,scale:0.93 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:0.93 }} transition={{ delay:i*0.04, duration:0.3 }}
                onClick={() => item.real && setLightbox(item)}
                className={`break-inside-avoid mb-3 rounded-2xl overflow-hidden group relative ${HEIGHTS[i % HEIGHTS.length]} bg-[#1a2e1f] ${item.real ? "cursor-pointer" : ""}`}>
                {item.real && item.img ? (
                  <>
                    <Image src={item.img} alt={item.label} fill sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="text-padella-cream text-xs font-semibold">{item.label}</div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <span className="text-5xl opacity-20">{(item as { emoji?: string }).emoji ?? "🍽️"}</span>
                    <span className="text-padella-cream/20 text-[10px]">{item.label}</span>
                    <span className="text-padella-cream/10 text-[9px]">Coming soon</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-50" onClick={() => setLightbox(null)} />
            <motion.div initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:0.9 }}
              className="fixed inset-4 md:inset-16 z-50 flex items-center justify-center">
              <div className="relative w-full h-full max-w-3xl mx-auto">
                {lightbox.img && <Image src={lightbox.img} alt={lightbox.label} fill className="object-contain rounded-2xl" sizes="90vw" />}
                <button onClick={() => setLightbox(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center">
                  <X size={16} className="text-white" />
                </button>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="text-white/70 text-sm bg-black/40 px-3 py-1 rounded-full">{lightbox.label}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
