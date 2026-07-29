"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToggleLeft, ToggleRight, X, Search } from "lucide-react";
import { MENU_CATEGORIES } from "@/lib/menuData";
import { subscribeMenu, deleteMenuItem, updateMenuItem, RemoteMenuItem } from "@/lib/menuRepo";

export default function AdminMenuPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<RemoteMenuItem[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<RemoteMenuItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsub = subscribeMenu(setItems);
    return () => unsub();
  }, []);

  const filtered = items
    .filter(item => activeCategory === "all" || item.category === activeCategory)
    .filter(item => !search || item.name.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteMenuItem(confirmDelete.id, confirmDelete.imagePath);
      setConfirmDelete(null);
    } catch (e) {
      alert("Delete failed: " + (e instanceof Error ? e.message : "unknown error"));
    } finally {
      setDeleting(false);
    }
  };

  const toggleAvailable = async (item: RemoteMenuItem) => {
    try {
      await updateMenuItem(item.id, { available: !item.available });
    } catch (e) {
      alert("Update failed: " + (e instanceof Error ? e.message : "unknown error"));
    }
  };

  return (
    <div className="min-h-screen bg-padella-charcoal pt-20">
      <div className="container-padella py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-padella-cream text-3xl mb-1">Menu Manager</h1>
            <p className="text-padella-cream/50 text-sm">{items.length} dishes — manage availability and delete items</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-5 max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-padella-cream/40" />
          <input
            type="text"
            placeholder="Search dishes by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-padella-green-light/60 backdrop-blur-md border border-padella-cream/10 rounded-full text-padella-cream placeholder:text-padella-cream/30 text-sm focus:outline-none focus:border-padella-gold/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X size={14} className="text-padella-cream/40 hover:text-padella-cream" />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          <button onClick={() => setActiveCategory("all")}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${activeCategory === "all" ? "bg-padella-gold text-padella-green" : "glass border border-padella-cream/10 text-padella-cream/60"}`}>
            All ({items.length})
          </button>
          {MENU_CATEGORIES.map(cat => {
            const count = items.filter(i => i.category === cat.id).length;
            if (count === 0) return null;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${activeCategory === cat.id ? "bg-padella-gold text-padella-green" : "glass border border-padella-cream/10 text-padella-cream/60"}`}>
                {cat.emoji} {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Items table */}
        <div className="glass border border-padella-cream/10 rounded-xl2 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-padella-cream/10">
                <th className="text-left p-4 text-padella-cream/50 text-xs font-semibold tracking-wide uppercase">Dish</th>
                <th className="text-left p-4 text-padella-cream/50 text-xs font-semibold tracking-wide uppercase hidden md:table-cell">Category</th>
                <th className="text-left p-4 text-padella-cream/50 text-xs font-semibold tracking-wide uppercase">Price</th>
                <th className="text-left p-4 text-padella-cream/50 text-xs font-semibold tracking-wide uppercase hidden sm:table-cell">Status</th>
                <th className="text-right p-4 text-padella-cream/50 text-xs font-semibold tracking-wide uppercase">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-padella-cream/5">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-padella-cream/3 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div>
                        <div className="text-padella-cream/90 text-sm font-medium">{item.name}</div>
                        <div className="text-padella-cream/40 text-xs line-clamp-1 max-w-xs mt-0.5">{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="px-2 py-1 bg-padella-cream/5 text-padella-cream/50 text-xs rounded-full capitalize">{item.category}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-padella-gold font-semibold text-sm">{item.price} THB</span>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <button
                      onClick={() => toggleAvailable(item)}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors ${item.available ? "bg-green-900/30 text-green-400 hover:bg-green-900/50" : "bg-red-900/30 text-red-400 hover:bg-red-900/50"}`}
                    >
                      {item.available ? "✓ Active" : "✗ Hidden"}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => toggleAvailable(item)}
                        title={item.available ? "Hide from menu" : "Show on menu"}
                        className="w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-padella-gold/20 text-padella-gold/70 transition-all"
                      >
                        {item.available ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(item)}
                        title="Delete dish"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all shadow-sm"
                      >
                        <X size={15} strokeWidth={3} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-padella-cream/30 text-sm">No dishes in this category.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => !deleting && setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass border border-red-500/30 rounded-xl2 p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-padella-cream text-lg">Delete dish?</h3>
                <button onClick={() => !deleting && setConfirmDelete(null)} className="text-padella-cream/40 hover:text-padella-cream">
                  <X size={18} />
                </button>
              </div>
              <p className="text-padella-cream/60 text-sm mb-6">
                This will permanently delete <span className="text-padella-cream font-medium">&quot;{confirmDelete.name}&quot;</span> and its photo. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-lg glass border border-padella-cream/10 text-padella-cream/70 text-sm font-medium hover:border-padella-cream/20 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
