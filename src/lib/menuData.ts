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

// SAMPLE_MENU svuotato: tutti i piatti vengono ora caricati da Supabase (admin).
export const SAMPLE_MENU: MenuItem[] = [];

export const CATEGORY_EMOJI: Record<string, string> = {
  pasta: "🍝", pizza: "🍕", starter: "🫒", cocktails: "🍹", dessert: "🍮",
  main: "🥩", snack: "🥨", salad: "🥗", smoothies: "🥭", coffee: "☕",
  beer: "🍺", panini: "🥪", fusion: "🌟", breakfast: "🌅", "daily-special": "⭐",
  "soft-drinks": "🥤",
};
