import { MenuItem, TimeSlot } from "@/types";

export const TIME_SLOTS: TimeSlot[] = [
  { id: "morning",   name: "Morning",    startHour: 7,  endHour: 11, featuredCategories: ["breakfast", "coffee", "smoothies"], label: "Good Morning" },
  { id: "lunch",     name: "Lunch",      startHour: 11, endHour: 15, featuredCategories: ["daily-special", "pasta", "pizza", "salad"], label: "Time for Lunch" },
  { id: "afternoon", name: "Afternoon",  startHour: 15, endHour: 18, featuredCategories: ["smoothies", "coffee", "snack"], label: "Afternoon Delights" },
  { id: "aperitivo", name: "Aperitivo",  startHour: 18, endHour: 20, featuredCategories: ["cocktails", "snack", "starter"], label: "Aperitivo Time" },
  { id: "dinner",    name: "Dinner",     startHour: 20, endHour: 24, featuredCategories: ["main", "pasta", "pizza", "cocktails"], label: "Dinner is Served" },
];

export const getCurrentTimeSlot = (): TimeSlot => {
  const hour = new Date().getHours();
  return TIME_SLOTS.find(slot => hour >= slot.startHour && hour < slot.endHour) ?? TIME_SLOTS[4];
};

export const MENU_CATEGORIES = [
  { id: "breakfast",     label: "Breakfast",     emoji: "🌅", timeSlot: "morning" },
  { id: "daily-special", label: "Daily Special", emoji: "⭐", timeSlot: "lunch" },
  { id: "snack",         label: "Snacks",         emoji: "🥨", timeSlot: "all" },
  { id: "starter",       label: "Starters",       emoji: "🫒", timeSlot: "all" },
  { id: "panini",        label: "Panini",          emoji: "🥪", timeSlot: "all" },
  { id: "pizza",         label: "Pizza",           emoji: "🍕", timeSlot: "all" },
  { id: "pasta",         label: "Pasta",           emoji: "🍝", timeSlot: "all" },
  { id: "main",          label: "Main Course",     emoji: "🥩", timeSlot: "dinner" },
  { id: "salad",         label: "Salads",          emoji: "🥗", timeSlot: "all" },
  { id: "fusion",        label: "Fusion",          emoji: "🌟", timeSlot: "all" },
  { id: "dessert",       label: "Desserts",        emoji: "🍮", timeSlot: "all" },
  { id: "soft-drinks",   label: "Soft Drinks",     emoji: "🥤", timeSlot: "all" },
  { id: "smoothies",     label: "Smoothies",       emoji: "🥭", timeSlot: "all" },
  { id: "coffee",        label: "Coffee & Tea",    emoji: "☕", timeSlot: "all" },
  { id: "beer",          label: "Beer",            emoji: "🍺", timeSlot: "all" },
  { id: "cocktails",     label: "Cocktails",       emoji: "🍹", timeSlot: "all" },
] as const;

export const SAMPLE_MENU: MenuItem[] = [
  // Pasta
  { id: "p1", name: "Tagliatelle al Ragù", nameIt: "Tagliatelle al Ragù", description: "Fresh handmade pasta with slow-cooked beef ragù", story: "Inspired by traditional Sunday lunches in Northern Italy, where ragù simmers for hours filling the house with warmth.", pairing: "Sangiovese or Chianti Classico", price: 320, currency: "THB", category: "pasta", image: "/images/food/tagliere-salumi.jpg", tags: ["signature", "classic"], isSpecial: false, available: true, order: 1, ingredients: ["Fresh tagliatelle", "Beef", "Tomato", "Carrot", "Celery", "Red wine", "Parmigiano Reggiano"] },
  { id: "p2", name: "Cacio e Pepe", description: "Roman pasta with Pecorino Romano and black pepper", story: "A dish born from Roman shepherds — just three ingredients, infinite soul.", pairing: "Frascati or crisp Pinot Grigio", price: 280, currency: "THB", category: "pasta", image: "/images/food/cacio-pepe.jpg", tags: ["vegetarian", "roman"], isVegetarian: true, available: true, order: 2, ingredients: ["Tonnarelli pasta", "Pecorino Romano", "Parmigiano", "Black pepper"] },
  { id: "p3", name: "Spaghetti alle Vongole", description: "Spaghetti with fresh clams, white wine, chilli and parsley", story: "The essence of the Italian coast — sea, simplicity, and passion on a plate.", pairing: "Vermentino or Falanghina", price: 360, currency: "THB", category: "pasta", image: "/images/food/spaghetti-vongole.jpg", tags: ["seafood", "coastal"], available: true, order: 3 },
  { id: "p4", name: "Penne all'Arrabbiata", description: "Spicy tomato sauce with garlic and fresh chilli", story: "The fire of Southern Italy in every bite — arrabbiata means 'angry' for a reason.", pairing: "Primitivo or Aglianico", price: 260, currency: "THB", category: "pasta", image: "/images/food/penne-arrabbiata.jpg", tags: ["vegan", "spicy"], isVegan: true, isSpicy: true, available: true, order: 4 },

  // Pizza
  { id: "pz1", name: "Pizza Margherita", description: "San Marzano tomato, Fior di Latte, fresh basil, extra virgin olive oil", story: "Named after Queen Margherita of Savoy in 1889 — the most iconic pizza in the world.", pairing: "Peroni or light Barbera", price: 280, currency: "THB", category: "pizza", image: "/images/food/pizza-margherita.jpg", tags: ["classic", "vegetarian"], isVegetarian: true, available: true, order: 1 },
  { id: "pz2", name: "Pizza Diavola", description: "Spicy salami, San Marzano tomato, Fior di Latte, chilli oil", story: "For those who like their pizza with a little heat — diavola, the devil's pizza.", pairing: "Primitivo or Italian IPA", price: 320, currency: "THB", category: "pizza", image: "/images/food/pizza-diavola.jpg", tags: ["spicy", "signature"], isSpicy: true, available: true, order: 2 },
  { id: "pz3", name: "Pizza Tartufata", description: "Truffle cream, mushrooms, Taleggio, rocket, Parmigiano shavings", story: "Earthy, rich, and indulgent — a pizza for those special moments.", pairing: "Barolo or Pinot Nero", price: 420, currency: "THB", category: "pizza", image: "/images/food/pizza-tartufata.jpg", tags: ["premium", "vegetarian"], isVegetarian: true, isNew: true, available: true, order: 3 },

  // Starters
  { id: "s1", name: "Burrata Pugliese", description: "Fresh burrata, heirloom tomatoes, basil oil, fleur de sel", story: "From the heel of Italy's boot — Puglia's greatest gift to the world.", pairing: "Bellini or Primitivo Rosé", price: 280, currency: "THB", category: "starter", image: "/images/food/burrata-rucola.jpg", tags: ["vegetarian", "signature"], isVegetarian: true, isNew: true, available: true, order: 1 },
  { id: "s2", name: "Carpaccio di Manzo", description: "Thinly sliced beef tenderloin, rocket, capers, Parmigiano, lemon dressing", story: "Invented at Harry's Bar in Venice in 1950 — a dish of pure elegance.", pairing: "Champagne or crisp Soave", price: 320, currency: "THB", category: "starter", image: "/images/food/tagliere-misto.jpg", tags: ["classic", "raw"], available: true, order: 2 },
  { id: "s3", name: "Bruschetta Tricolore", description: "Toasted sourdough, heirloom tomatoes, basil, stracciatella", story: "The colors of Italy on a slice of bread — red, white, and green.", pairing: "Prosecco or light Pinot Grigio", price: 180, currency: "THB", category: "starter", image: "/images/food/bruschetta-pomodori.jpg", tags: ["vegan-option", "light"], isVegetarian: true, available: true, order: 3 },

  // Cocktails
  { id: "c1", name: "Aperol Spritz Padella", description: "Aperol, Prosecco, soda, blood orange, sprig of rosemary", story: "Our take on Italy's most beloved aperitivo — served at golden hour by the pool.", pairing: "Best with bruschetta or light snacks", price: 220, currency: "THB", category: "cocktails", image: "/images/drinks/aperol-spritz.jpg", tags: ["signature", "aperitivo"], isNew: false, available: true, order: 1 },
  { id: "c2", name: "Negroni Bianco", description: "Gin, Cinzano Bianco, Campari, lemon zest, ice sphere", story: "A modern reinterpretation of the classic Negroni, lighter and more aromatic.", pairing: "Perfect before dinner", price: 280, currency: "THB", category: "cocktails", image: "/images/drinks/negroni.jpg", tags: ["classic", "strong"], available: true, order: 2 },
  { id: "c3", name: "Hugo Spritz", description: "Elderflower liqueur, Prosecco, fresh mint, lime, soda", story: "Born in the Dolomites, this refreshing spritz captures the spirit of the mountains.", pairing: "Antipasti or light summer bites", price: 240, currency: "THB", category: "cocktails", image: "/images/drinks/hugo.jpg", tags: ["light", "floral"], isNew: true, available: true, order: 3 },

  // Main
  { id: "m1", name: "Bistecca alla Fiorentina", description: "T-bone steak, 600g, rosemary, garlic, extra virgin olive oil", story: "The king of Italian steaks — a Florentine tradition since the Renaissance.", pairing: "Brunello di Montalcino or Super Tuscan", price: 890, currency: "THB", category: "main", image: "/images/food/bistecca.jpg", tags: ["premium", "signature"], isSpecial: true, available: true, order: 1 },
  { id: "m2", name: "Branzino al Forno", description: "Whole sea bass, capers, olives, cherry tomatoes, herbs, white wine", story: "Mediterranean simplicity — the sea on your plate, cooked with respect.", pairing: "Vermentino or Pinot Grigio delle Venezie", price: 480, currency: "THB", category: "main", image: "/images/food/branzino.jpg", tags: ["seafood", "healthy"], available: true, order: 2 },

  // Desserts
  { id: "d1", name: "Tiramisù della Casa", description: "Classic tiramisù with Savoiardi, mascarpone, espresso, Marsala", story: "Our family recipe — unchanged for 20 years, because perfection doesn't need improvement.", pairing: "Vin Santo or espresso", price: 180, currency: "THB", category: "dessert", image: "/images/food/muffin-colazione.jpg", tags: ["classic", "signature"], isVegetarian: true, available: true, order: 1 },
  { id: "d2", name: "Panna Cotta al Pistacchio", description: "Silky panna cotta, Sicilian pistachio cream, honey, candied pistachios", story: "From the volcanic soils of Mount Etna, the world's finest pistachios find their form.", pairing: "Moscato d'Asti or dessert wine", price: 160, currency: "THB", category: "dessert", image: "/images/food/frutta-fresca.png", tags: ["vegetarian", "new"], isVegetarian: true, isNew: true, available: true, order: 2 },

  // Smoothies
  { id: "sm1", name: "Tropical Italia", description: "Mango, pineapple, passion fruit, lime, coconut milk", story: "The tropics meet Italian freshness in every sip.", price: 150, currency: "THB", category: "smoothies", image: "/images/drinks/tropical.jpg", tags: ["vegan", "fresh"], isVegan: true, available: true, order: 1 },
  { id: "sm2", name: "Verde Detox", description: "Spinach, cucumber, green apple, ginger, lemon, mint", story: "Inspired by the freshness of Italian herb gardens.", price: 150, currency: "THB", category: "smoothies", image: "/images/drinks/verde.jpg", tags: ["vegan", "healthy"], isVegan: true, available: true, order: 2 },

  // Breakfast
  { id: "b1", name: "Italian Breakfast Board", description: "Cornetto, croissant, prosciutto, cheese, fresh fruit, espresso", story: "Start your day the Italian way — slow, savored, and soulful.", price: 320, currency: "THB", category: "breakfast", image: "/images/food/tagliere-salumi.jpg", tags: ["morning", "classic"], available: true, order: 1 },
  { id: "b2", name: "Uova in Purgatorio", description: "Eggs poached in spicy San Marzano tomato sauce, sourdough toast", story: "Eggs in purgatory — a beloved Southern Italian tradition that warms the soul.", price: 220, currency: "THB", category: "breakfast", image: "/images/food/muffin-colazione.jpg", tags: ["morning", "hot"], available: true, order: 2 },
];

export const CATEGORY_EMOJI: Record<string, string> = {
  pasta: "🍝", pizza: "🍕", starter: "🫒", cocktails: "🍹", dessert: "🍮",
  main: "🥩", snack: "🥨", salad: "🥗", smoothies: "🥭", coffee: "☕",
  beer: "🍺", panini: "🥪", fusion: "🌟", breakfast: "🌅", "daily-special": "⭐",
  "soft-drinks": "🥤",
};
