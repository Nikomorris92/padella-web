export interface MenuItem {
  id: string;
  name: string;
  nameIt?: string;
  description: string;
  story?: string;
  pairing?: string;
  price: number;
  currency: string;
  category: MenuCategory;
  subcategory?: string;
  image: string;
  tags: string[];
  isSpecial?: boolean;
  isNew?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSpicy?: boolean;
  ingredients?: string[];
  calories?: number;
  allergens?: string[];
  available: boolean;
  order: number;
}

export type MenuCategory =
  | "snack" | "starter" | "panini" | "pizza" | "pasta"
  | "main" | "salad" | "fusion" | "dessert"
  | "soft-drinks" | "smoothies" | "coffee" | "beer" | "cocktails"
  | "breakfast" | "daily-special";

export interface TimeSlot {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  featuredCategories: MenuCategory[];
  label: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  image: string;
  type: "padel-tournament" | "aperitivo" | "dj-set" | "brunch" | "dinner" | "private";
  price?: number;
  maxAttendees?: number;
  currentAttendees?: number;
  available: boolean;
}

export interface Review {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  text: string;
  date: string;
  source: "google";
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  category: "food" | "drinks" | "padel" | "pool" | "events";
  width: number;
  height: number;
}

export interface AnalyticsData {
  pageViews: number;
  sessions: number;
  returningUsers: number;
  menuViews: Record<string, number>;
  menuClicks: Record<string, number>;
  whatsappClicks: number;
  lineClicks: number;
  bookingClicks: number;
  qrMenuScans: number;
  qrReviewScans: number;
  topDishes: Array<{ id: string; name: string; views: number }>;
  topCategories: Array<{ category: string; views: number }>;
}
