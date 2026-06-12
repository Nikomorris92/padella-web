"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MenuItem } from "@/types";

const CATEGORY_EMOJI: Record<string, string> = {
  pasta: "🍝", pizza: "🍕", starter: "🫒", cocktails: "🍹", dessert: "🍮",
  main: "🥩", snack: "🥨", salad: "🥗", smoothies: "🥭", coffee: "☕",
  beer: "🍺", panini: "🥪", fusion: "🌟", breakfast: "🌅", "daily-special": "⭐",
  "soft-drinks": "🥤",
};

export default function MenuItemCard({ item, index, onClick }: { item: MenuItem; index: number; onClick: () => void }) {
  const isStaticImage = !!item.image && (item.image.startsWith("/images/") || item.image.startsWith("https://"));
  const isDataImage = !!item.image && item.image.startsWith("data:");
  const hasImage = isStaticImage || isDataImage;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.4 }}
      onClick={onClick}
      className="card-premium overflow-hidden group cursor-pointer"
    >
      {/* Image — più alta + object-contain così si vede il piatto intero */}
      <div className="relative h-56 md:h-60 overflow-hidden bg-gradient-to-br from-padella-green-muted to-padella-charcoal">
        {isStaticImage ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-700"
          />
        ) : isDataImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl opacity-15 group-hover:opacity-25 group-hover:scale-110 transition-all duration-500">
              {CATEGORY_EMOJI[item.category] ?? "🍽️"}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-padella-green/80 via-transparent to-transparent" />

        {/* Price */}
        <div className="absolute bottom-2 right-2 bg-padella-gold/90 backdrop-blur-sm text-padella-green text-xs font-bold px-2.5 py-1 rounded-full">
          {item.price} {item.currency}
        </div>

        {/* Badges top left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.isNew && <span className="px-1.5 py-0.5 bg-padella-terracotta text-white text-[9px] font-bold tracking-wide rounded-full">NEW</span>}
          {item.isSpecial && <span className="px-1.5 py-0.5 bg-padella-gold text-padella-green text-[9px] font-bold tracking-wide rounded-full">★</span>}
        </div>

        {/* Dietary badges top right */}
        <div className="absolute top-2 right-2 flex gap-1">
          {item.isVegetarian && <span className="w-5 h-5 bg-green-600/80 text-white text-[8px] font-bold rounded-full flex items-center justify-center">V</span>}
          {item.isVegan && <span className="w-5 h-5 bg-emerald-600/80 text-white text-[8px] font-bold rounded-full flex items-center justify-center">VE</span>}
          {item.isSpicy && <span className="text-sm">🌶️</span>}
        </div>
      </div>

      <div className="p-4">
        <div className="text-padella-gold/60 text-[9px] font-semibold tracking-[0.2em] uppercase mb-1">{item.category.replace("-", " ")}</div>
        <h3 className="font-display font-semibold text-padella-cream text-base mb-1.5 group-hover:text-padella-gold transition-colors leading-tight line-clamp-1">
          {item.name}
        </h3>
        <p className="text-padella-cream/45 text-xs leading-relaxed line-clamp-2">{item.description}</p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1">
            {item.tags.slice(0, 2).map(t => (
              <span key={t} className="px-2 py-0.5 bg-padella-cream/5 text-padella-cream/40 text-[9px] rounded-full">{t}</span>
            ))}
          </div>
          <span className="text-padella-gold/60 text-xs group-hover:text-padella-gold transition-colors">Details →</span>
        </div>
      </div>
    </motion.div>
  );
}
