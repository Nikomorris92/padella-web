"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Filter, Clock } from "lucide-react";
import { SAMPLE_MENU, MENU_CATEGORIES, getCurrentTimeSlot } from "@/lib/menuData";
import { MenuCategory, MenuItem } from "@/types";
import { subscribeMenu } from "@/lib/menuRepo";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import MenuItemCard from "./MenuItemCard";
import MenuItemModal from "./MenuItemModal";
import TimeSlotBanner from "./TimeSlotBanner";

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<MenuCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [filters, setFilters] = useState({ vegetarian: false, vegan: false, glutenFree: false, spicy: false });
  const [showFilters, setShowFilters] = useState(false);
  const [adminItems, setAdminItems] = useState<MenuItem[]>([]);
  const { config } = useSiteConfig();
  const timeSlot = getCurrentTimeSlot();

  // Carica i piatti dall'admin (Firestore real-time)
  useEffect(() => {
    const unsubscribe = subscribeMenu(remoteItems => {
      const mapped: MenuItem[] = remoteItems.map((it, i) => ({
        id: it.id,
        name: it.name,
        description: it.description ?? "",
        story: it.story,
        price: it.price,
        currency: "THB",
        category: it.category as MenuCategory,
        image: it.image ?? "",
        tags: it.tags ?? [],
        isNew: true,
        isVegetarian: !!it.isVegetarian,
        isVegan: !!it.isVegan,
        isSpicy: !!it.isSpicy,
        isGlutenFree: !!it.isGlutenFree,
        available: it.available ?? true,
        order: 999 + i,
      }));
      setAdminItems(mapped);
    });
    return () => unsubscribe();
  }, []);

  const allItems = useMemo(() => [...SAMPLE_MENU, ...adminItems], [adminItems]);

  // Conteggio piatti disponibili per categoria
  const countsByCategory = useMemo(() => {
    const out: Record<string, number> = {};
    for (const it of allItems) {
      if (!it.available) continue;
      out[it.category] = (out[it.category] ?? 0) + 1;
    }
    return out;
  }, [allItems]);

  const filtered = useMemo(() => {
    return allItems.filter(item => {
      if (!item.available) return false;
      if (activeCategory !== "all" && item.category !== activeCategory) return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.vegetarian && !item.isVegetarian && !item.isVegan) return false;
      if (filters.vegan && !item.isVegan) return false;
      if (filters.glutenFree && !item.isGlutenFree) return false;
      if (filters.spicy && !item.isSpicy) return false;
      return true;
    }).sort((a, b) => a.order - b.order);
  }, [activeCategory, search, filters, allItems]);

  const featuredForTimeSlot = useMemo(() =>
    allItems.filter(item => timeSlot.featuredCategories.includes(item.category as MenuCategory) && item.available).slice(0, 4),
    [timeSlot, allItems]
  );

  // eslint-disable-next-line no-console
  console.log("[MENU-DEBUG]", "v4-FLAGS", "adminItems:", adminItems.length, adminItems.map(i => ({ n: i.name, V: i.isVegetarian, VG: i.isVegan, S: i.isSpicy, GF: i.isGlutenFree })));

  return (
    <div className="min-h-screen bg-padella-green pt-20">
      <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-[10px] text-center py-0.5 z-[100] font-mono">v4 · admin={adminItems.length} · veg={adminItems.filter(i=>i.isVegetarian).length}</div>
      {/* Page header */}
      <div className="relative py-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-padella-charcoal/40 to-transparent" />
        <div className="container-padella relative">
          <div className="section-label justify-center mb-4">
            <span className="w-8 h-px bg-padella-gold/50" /> Our Menu <span className="w-8 h-px bg-padella-gold/50" />
          </div>
          <h1 className="font-display font-bold text-padella-cream mb-3" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
            <span className="text-gradient-gold">Cucina Italiana</span>
          </h1>
          <p className="text-padella-cream/60 max-w-xl mx-auto">
            Handcrafted with love, inspired by Italian traditions, and served with Bangkok warmth.
          </p>
        </div>
      </div>

      {/* Time slot banner */}
      <TimeSlotBanner slot={timeSlot} items={featuredForTimeSlot} onSelect={setSelectedItem} />

      <div className="container-padella pb-20">
        {/* Search + filters bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 sticky top-20 z-30 py-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-padella-cream/40" />
            <input
              type="text"
              placeholder="Search dishes, ingredients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-padella-green-light/60 backdrop-blur-md border border-padella-cream/10 rounded-full text-padella-cream placeholder:text-padella-cream/30 text-sm focus:outline-none focus:border-padella-gold/40 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X size={14} className="text-padella-cream/40 hover:text-padella-cream" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-medium transition-all ${showFilters ? "bg-padella-gold text-padella-green border-padella-gold" : "glass border-padella-cream/10 text-padella-cream/70 hover:border-padella-cream/20"}`}
          >
            <Filter size={14} /> Filters {Object.values(filters).some(Boolean) && <span className="w-2 h-2 bg-padella-terracotta rounded-full" />}
          </button>
        </div>

        {/* Filter pills */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="flex flex-wrap gap-2 py-2">
                {[
                  { key: "vegetarian", label: "🌱 Vegetarian" },
                  { key: "vegan", label: "🌿 Vegan" },
                  { key: "glutenFree", label: "🌾 Gluten-Free" },
                  { key: "spicy", label: "🌶️ Spicy" },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilters(prev => {
                      const isActive = prev[f.key as keyof typeof prev];
                      const reset = { vegetarian: false, vegan: false, glutenFree: false, spicy: false };
                      return isActive ? reset : { ...reset, [f.key]: true };
                    })}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${filters[f.key as keyof typeof filters] ? "bg-padella-gold text-padella-green font-semibold" : "glass border border-padella-cream/10 text-padella-cream/60"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
          <button
            onClick={() => setActiveCategory("all")}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${activeCategory === "all" ? "bg-padella-gold text-padella-green" : "glass border border-padella-cream/10 text-padella-cream/60 hover:border-padella-cream/20"}`}
          >
            All
          </button>
          {MENU_CATEGORIES.map(cat => {
            const count = countsByCategory[cat.id] ?? 0;
            const isActive = activeCategory === cat.id;
            const showCount = config?.show_category_count === true;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as MenuCategory)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${isActive ? "bg-padella-gold text-padella-green" : "glass border border-padella-cream/10 text-padella-cream/60 hover:border-padella-cream/20"}`}
              >
                <span>{cat.emoji}</span> {cat.label}
                {showCount && count > 0 && (
                  <span className={`ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold tabular-nums ${isActive ? "bg-padella-green/15 text-padella-green" : "bg-padella-gold/20 text-padella-gold"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results count */}
        <div className="text-padella-cream/40 text-xs mb-6">
          {filtered.length} dish{filtered.length !== 1 ? "es" : ""} {activeCategory !== "all" ? `in ${MENU_CATEGORIES.find(c => c.id === activeCategory)?.label}` : ""}
        </div>

        {/* Menu grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-padella-cream/30">
            <div className="text-5xl mb-4">🍽️</div>
            <p>No dishes found. Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((item, i) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  index={i}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Item modal */}
      <AnimatePresence>
        {selectedItem && (
          <MenuItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
