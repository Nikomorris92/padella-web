"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Upload, Sparkles, Eye, Edit2, Trash2, ToggleLeft } from "lucide-react";
import { SAMPLE_MENU, MENU_CATEGORIES } from "@/lib/menuData";
import { MenuItem } from "@/types";

export default function AdminMenuPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<null | { name: string; description: string; story: string }>(null);

  const items = activeCategory === "all"
    ? SAMPLE_MENU
    : SAMPLE_MENU.filter(item => item.category === activeCategory);

  const simulateAI = () => {
    setAiProcessing(true);
    setTimeout(() => {
      setAiProcessing(false);
      setAiResult({
        name: "Risotto ai Porcini",
        description: "Creamy Arborio rice with wild porcini mushrooms, white wine, Parmigiano Reggiano and fresh thyme.",
        story: "Inspired by the misty forests of Umbria, where porcini season is a sacred ritual passed down through generations.",
      });
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-padella-charcoal pt-20">
      <div className="container-padella py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-padella-cream text-3xl mb-1">Menu Manager</h1>
            <p className="text-padella-cream/50 text-sm">Add, edit, and manage your menu items</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowUpload(true)} className="btn-primary !text-sm !py-2.5">
              <Upload size={14} /> Add Dish
            </button>
          </div>
        </div>

        {/* AI Upload modal */}
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-padella-gold/20 rounded-xl3 p-7 mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-padella-gold" />
              <h3 className="font-semibold text-padella-cream">AI Dish Publisher</h3>
              <span className="text-padella-gold/60 text-xs px-2 py-0.5 bg-padella-gold/10 rounded-full">Powered by AI</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload zone */}
              <div>
                <div
                  className="border-2 border-dashed border-padella-cream/20 rounded-xl2 p-10 text-center cursor-pointer hover:border-padella-gold/40 transition-colors"
                  onClick={simulateAI}
                >
                  {aiProcessing ? (
                    <div className="space-y-3">
                      <div className="text-3xl animate-spin inline-block">✨</div>
                      <p className="text-padella-gold text-sm font-medium">AI is analyzing your photo...</p>
                      <div className="space-y-1.5 text-padella-cream/40 text-xs">
                        <p>✓ Enhancing image quality</p>
                        <p>✓ Applying Padella style</p>
                        <p className="animate-pulse">⟳ Generating description...</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={32} className="text-padella-cream/30 mx-auto mb-3" />
                      <p className="text-padella-cream/60 text-sm">Drop photo here or click to upload</p>
                      <p className="text-padella-cream/30 text-xs mt-1">JPG, PNG — max 10MB</p>
                      <p className="text-padella-gold/60 text-xs mt-3">🤖 Click to demo AI generation</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI result */}
              {aiResult ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-padella-gold/70 text-xs font-semibold tracking-wide uppercase block mb-1">Dish Name</label>
                    <input defaultValue={aiResult.name} className="w-full px-4 py-2.5 bg-padella-green-light border border-padella-cream/10 rounded-lg text-padella-cream text-sm focus:outline-none focus:border-padella-gold/40" />
                  </div>
                  <div>
                    <label className="text-padella-gold/70 text-xs font-semibold tracking-wide uppercase block mb-1">Description</label>
                    <textarea defaultValue={aiResult.description} rows={3} className="w-full px-4 py-2.5 bg-padella-green-light border border-padella-cream/10 rounded-lg text-padella-cream text-sm focus:outline-none focus:border-padella-gold/40 resize-none" />
                  </div>
                  <div>
                    <label className="text-padella-gold/70 text-xs font-semibold tracking-wide uppercase block mb-1">Story</label>
                    <textarea defaultValue={aiResult.story} rows={3} className="w-full px-4 py-2.5 bg-padella-green-light border border-padella-cream/10 rounded-lg text-padella-cream text-sm focus:outline-none focus:border-padella-gold/40 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-primary flex-1 !text-sm !py-2.5">Publish to Menu</button>
                    <button onClick={() => { setAiResult(null); setShowUpload(false); }} className="btn-outline !text-sm !py-2.5 !px-5">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center text-padella-cream/30 text-sm">
                  Upload a photo to see AI magic ✨
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          <button onClick={() => setActiveCategory("all")}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${activeCategory === "all" ? "bg-padella-gold text-padella-green" : "glass border border-padella-cream/10 text-padella-cream/60"}`}>
            All ({SAMPLE_MENU.length})
          </button>
          {MENU_CATEGORIES.map(cat => {
            const count = SAMPLE_MENU.filter(i => i.category === cat.id).length;
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
                <th className="text-right p-4 text-padella-cream/50 text-xs font-semibold tracking-wide uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-padella-cream/5">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-padella-cream/3 transition-colors group">
                  <td className="p-4">
                    <div className="text-padella-cream/90 text-sm font-medium">{item.name}</div>
                    <div className="text-padella-cream/40 text-xs line-clamp-1 max-w-xs mt-0.5">{item.description}</div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="px-2 py-1 bg-padella-cream/5 text-padella-cream/50 text-xs rounded-full capitalize">{item.category}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-padella-gold font-semibold text-sm">{item.price} {item.currency}</span>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${item.available ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                      {item.available ? "✓ Active" : "✗ Hidden"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-7 h-7 rounded-full glass flex items-center justify-center hover:bg-blue-500/20 text-blue-400 transition-all"><Eye size={12} /></button>
                      <button className="w-7 h-7 rounded-full glass flex items-center justify-center hover:bg-padella-gold/20 text-padella-gold transition-all"><Edit2 size={12} /></button>
                      <button className="w-7 h-7 rounded-full glass flex items-center justify-center hover:bg-green-500/20 text-green-400 transition-all"><ToggleLeft size={12} /></button>
                      <button className="w-7 h-7 rounded-full glass flex items-center justify-center hover:bg-red-500/20 text-red-400 transition-all"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
