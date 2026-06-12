"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { TimeSlot, MenuItem } from "@/types";
import { CATEGORY_EMOJI } from "@/lib/menuData";

export default function TimeSlotBanner({ slot, items, onSelect }: {
  slot: TimeSlot;
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="container-padella mb-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-padella-gold/10 border border-padella-gold/20 rounded-xl2 p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-padella-gold/70" />
          <span className="text-padella-gold/80 text-sm font-semibold">{slot.label} — Recommended for Now</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-padella-cream/5 border border-padella-cream/10 rounded-full hover:border-padella-gold/30 transition-all text-left"
            >
              <span className="text-lg">{(CATEGORY_EMOJI as Record<string, string>)[item.category] ?? "🍽️"}</span>
              <span className="text-padella-cream/75 text-xs font-medium whitespace-nowrap">{item.name}</span>
              <span className="text-padella-gold/70 text-xs">{item.price}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
