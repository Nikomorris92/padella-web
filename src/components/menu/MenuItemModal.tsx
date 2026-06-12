"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { X, Leaf, Flame, Wheat } from "lucide-react";
import { MenuItem } from "@/types";

const STORIES_BY_CATEGORY: Record<string, string> = {
  pizza: "Naturally leavened dough, fermented for 48 hours at 80% hydration with stone-milled Italian flours.\nBaked in a wood-fired oven at 450°C for exactly 90 seconds: tall airy crust, crispy base.\nSan Marzano DOP tomatoes from Campania, Agerola fior di latte mozzarella, basil torn by hand at service.\nEvery bite takes you to Naples — this isn't food, it's memory.",
  pasta: "Fresh pasta rolled by hand every morning with Sicilian durum semolina and free-range eggs.\nWorked with a rolling pin, cut with a knife, air-dried on wooden frames just like grandma did.\nThe sauce simmers slow — at least 4 hours — because time is the one ingredient you cannot buy.\nA dish that tells the patience of real Italian cooking.",
  starter: "A journey into Mediterranean flavors, opening dinner the way it should be opened: unhurried.\nSeasonal ingredients sourced from local growers and our direct imports from Italy.\nElegant plating, clean flavors, the perfect portion to wake up the appetite.\nThe beginning of a story you'll want to continue.",
  breakfast: "Italian breakfast is a ritual: strong coffee, warm pastry, slow conversation.\nWe prepare every morning with fresh ingredients, organic flours, seasonal market fruit.\nNo rush, no noise — just the taste of home, far from home.\nThe perfect start to the day, in our Bangkok-Italian way.",
  cocktails: "Crafted by our head bartender with selected Italian spirits and fresh ingredients.\nEach cocktail tells a region: from the Venetian Bellini to the Florentine Negroni, all the way to our signatures created in Bangkok.\nHand-carved ice, Sicilian citrus, aromatic herbs from our garden.\nOne sip, and you're in Italy.",
  dessert: "A family recipe passed down through three generations, still prepared by hand in our kitchen.\nPremium ingredients: 70% dark chocolate, fresh mascarpone, seasonal fruit.\nNo additives, no shortcuts — only time, dedication, and real ingredients.\nThe sweet finale of your Padella evening.",
  main: "The main course that tells the soul of Italian cooking: technique, raw material, respect.\nMeats selected from Italian farms, fresh fish of the day, seasonal vegetables.\nSlow cooking, careful plating, clean flavors — no unnecessary frills.\nA protagonist that stays in your memory.",
  panini: "Artisan bread kneaded in the morning with sourdough starter and baked in our oven.\nItalian fillings: San Daniele prosciutto, Campanian buffalo mozzarella, organic tomatoes.\nGrilled on a press for a few minutes — warm, fragrant, perfect for lunch or a snack.\nThe simplicity of the Italian table, in a fast and high-quality format.",
  salad: "Salads composed with fresh vegetables of the day and top-quality Italian ingredients.\nDOP extra virgin olive oil, IGP Modena balsamic vinegar, Cervia sea salt.\nA balanced mix of crunch, sweetness, salt and umami — the dish for those who want lightness with flavor.\nFresh, generous, Italian.",
  snack: "Small bites designed to accompany an aperitivo or a quiet pause.\nSelected ingredients, artisan preparation, careful presentation.\nPerfect to share with friends at the table, in front of a glass of wine.\nThe Italian culture of the snack, done the right way.",
  coffee: "100% arabica blend, roasted exclusively for us by a small Trieste roastery.\nExtracted with a professional machine at 9 bar, 92°C — the golden rule of Italian coffee.\nDense hazelnut-colored crema, intense aroma, round and persistent taste.\nA short but deep ritual, the way only Italians know how.",
  smoothies: "Fresh market fruit, blended on the spot with no added sugar or preservatives.\nBlends designed for taste and wellness: sweet, energetic, vitamin-packed.\nServed cold in tall glasses with careful garnish — perfect for Bangkok's heat.\nPure nature, Padella style.",
  fusion: "A creative dialogue between Italian tradition and top-quality Asian ingredients.\nOur chef respects both cultures without compromise, creating dishes that are one of a kind.\nPerfect for those who want Italian cuisine that also speaks Thai, Japanese, Vietnamese.\nThoughtful experimentation, surprising taste.",
  beer: "A selection of artisan Italian beers imported directly from breweries in Lombardy, Piedmont and Lazio.\nVaried styles: hoppy IPAs, crisp Lagers, intense Stouts, spiced Belgian Ales.\nServed at the right temperature in the right glass — details make the difference.\nItalian beer is a discovery worth making.",
  "soft-drinks": "Italian non-alcoholic drinks and fresh beverages prepared in-house.\nChinotto, Lemonade, Sicilian Orangeade, plus cold teas and natural infusions.\nNo industrial drinks — only authentic quality.\nThe perfect thirst quenchers for Bangkok's climate, with the taste of Italy.",
  "daily-special": "The daily special changes every 24 hours, inspired by seasonality and market availability.\nIt's the dish where our chef expresses himself freely, outside the regular menu.\nLimited edition — when it's gone, it's gone.\nFor those who want to discover something unique every time they come back.",
};

const FALLBACK_STORY = "A dish that tells the heart of Italy, prepared with care in our kitchen.\nIngredients selected directly from the finest Italian and local producers.\nTradition, quality and passion in every bite — as real cooking demands.\nAn authentic experience, in the heart of Bangkok.";

/** Restituisce una story di almeno 4 righe. Se quella salvata è troppo corta, usa il default per categoria. */
function getRichStory(item: MenuItem): string {
  const saved = (item.story ?? "").trim();
  const lines = saved.split("\n").filter(l => l.trim().length > 0);
  // Considera "troppo corta" se < 4 righe o < 180 caratteri totali
  if (lines.length >= 4 && saved.length >= 180) return saved;
  return STORIES_BY_CATEGORY[item.category] ?? FALLBACK_STORY;
}

const CATEGORY_EMOJI: Record<string, string> = {
  pasta: "🍝", pizza: "🍕", starter: "🫒", cocktails: "🍹", dessert: "🍮",
  main: "🥩", snack: "🥨", salad: "🥗", smoothies: "🥭", coffee: "☕",
  beer: "🍺", panini: "🥪", fusion: "🌟", breakfast: "🌅", "daily-special": "⭐",
  "soft-drinks": "🥤",
};

export default function MenuItemModal({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const isStaticImage = !!item.image && (item.image.startsWith("/images/") || item.image.startsWith("https://"));
  const isDataImage = !!item.image && item.image.startsWith("data:");
  const hasImage = isStaticImage || isDataImage;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-padella-charcoal/85 backdrop-blur-md z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] md:max-h-[90vh] bg-padella-green-light border border-padella-cream/10 rounded-xl3 overflow-y-auto z-50 shadow-premium"
      >
        {/* Image area — più alta e object-contain per vedere il piatto intero */}
        <div className="relative h-80 md:h-96 overflow-hidden flex-shrink-0 bg-gradient-to-br from-padella-green-muted to-padella-charcoal">
          {isStaticImage ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="480px"
              className="object-contain"
              priority
            />
          ) : isDataImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-9xl opacity-20">{CATEGORY_EMOJI[item.category] ?? "🍽️"}</span>
            </div>
          )}

          {/* Gradient over image */}
          <div className="absolute inset-0 bg-gradient-to-t from-padella-green-light via-padella-green-light/30 to-transparent" />

          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/20 transition-all z-10">
            <X size={15} className="text-padella-cream" />
          </button>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            {item.isNew && <span className="px-2 py-1 bg-padella-terracotta text-white text-[10px] font-bold tracking-wide rounded-full">NEW</span>}
            {item.isSpecial && <span className="px-2 py-1 bg-padella-gold text-padella-green text-[10px] font-bold tracking-wide rounded-full">SIGNATURE</span>}
          </div>

          {/* Title over image */}
          <div className="absolute bottom-4 left-0 right-0 px-5 z-10">
            <div className="text-padella-gold/70 text-[10px] font-semibold tracking-[0.2em] uppercase mb-1">{item.category.replace("-", " ")}</div>
            <h2 className="font-display font-bold text-padella-cream text-2xl leading-tight">{item.name}</h2>
            {item.nameIt && item.nameIt !== item.name && (
              <p className="text-padella-cream/40 text-sm italic">{item.nameIt}</p>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Price + dietary */}
          <div className="flex items-center justify-between">
            <div className="text-padella-gold font-bold text-2xl">{item.price} <span className="text-padella-gold/60 text-lg">{item.currency}</span></div>
            <div className="flex gap-2">
              {item.isVegetarian && <span title="Vegetarian" className="w-7 h-7 rounded-full bg-green-600/20 flex items-center justify-center"><Leaf size={13} className="text-green-400" /></span>}
              {item.isVegan && <span title="Vegan" className="w-7 h-7 rounded-full bg-emerald-600/20 flex items-center justify-center"><Leaf size={13} className="text-emerald-400" /></span>}
              {item.isSpicy && <span title="Spicy" className="w-7 h-7 rounded-full bg-red-600/20 flex items-center justify-center"><Flame size={13} className="text-red-400" /></span>}
              {item.isGlutenFree && <span title="Gluten-Free" className="w-7 h-7 rounded-full bg-amber-600/20 flex items-center justify-center"><Wheat size={13} className="text-amber-400" /></span>}
            </div>
          </div>

          {/* Description */}
          <p className="text-padella-cream/75 text-sm leading-relaxed">{item.description}</p>

          {/* Story — sempre minimo 4 righe (fallback automatico per categoria) */}
          <div className="bg-padella-cream/5 border-l-2 border-padella-gold/40 rounded-r-lg px-4 py-3">
            <div className="text-padella-gold/60 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">The Story</div>
            <div className="text-padella-cream/65 text-sm leading-relaxed italic space-y-1.5">
              {getRichStory(item).split("\n").filter(Boolean).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div>
              <div className="text-padella-gold/60 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">Ingredients</div>
              <div className="flex flex-wrap gap-1.5">
                {item.ingredients.map(ing => (
                  <span key={ing} className="px-2.5 py-1 bg-padella-cream/5 text-padella-cream/55 text-xs rounded-full border border-padella-cream/10">{ing}</span>
                ))}
              </div>
            </div>
          )}

          {/* Pairing */}
          {item.pairing && (
            <div className="bg-padella-gold/5 border border-padella-gold/15 rounded-xl2 px-4 py-3">
              <div className="text-padella-gold/60 text-[10px] font-semibold tracking-[0.2em] uppercase mb-1">🍷 Perfect Pairing</div>
              <p className="text-padella-cream/65 text-sm">{item.pairing}</p>
            </div>
          )}

          {/* CTAs */}
          <div className="pt-2 flex flex-col gap-2">
            <a
              href={`https://wa.me/66XXXXXXXXX?text=Hi%20Padella!%20I'd%20like%20to%20order%20the%20${encodeURIComponent(item.name)}`}
              target="_blank" rel="noopener noreferrer"
              className="btn-primary justify-center"
            >
              💬 Order via WhatsApp
            </a>
            <a
              href="https://wa.me/66XXXXXXXXX?text=Hi%20Padella!%20I'd%20like%20to%20reserve%20a%20table"
              target="_blank" rel="noopener noreferrer"
              className="btn-outline justify-center text-sm !py-3"
            >
              📅 Reserve a Table
            </a>
          </div>
        </div>
      </motion.div>
    </>
  );
}
