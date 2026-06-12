# PADELLA BANGKOK — Digital Ecosystem Architecture

## 🎯 Project Overview

**PADELLA BANGKOK** — Italian Restaurant, Padel Club, Pool & Lifestyle Destination

**Stack:** Next.js 16 · TypeScript · Tailwind CSS v4 · Firebase · Framer Motion

---

## 📁 Project Structure

```
padella-bangkok/
├── src/
│   ├── app/
│   │   ├── page.tsx                    ← Homepage
│   │   ├── layout.tsx                  ← Root layout + SEO
│   │   ├── globals.css                 ← Design system + Tailwind v4
│   │   ├── sitemap.ts                  ← XML sitemap
│   │   ├── robots.ts                   ← Robots.txt
│   │   ├── menu/page.tsx               ← Full digital menu
│   │   ├── padel/page.tsx              ← Padel club
│   │   ├── pool/page.tsx               ← Pool & lounge
│   │   ├── events/page.tsx             ← Events calendar
│   │   ├── gallery/page.tsx            ← Photo gallery
│   │   ├── community/page.tsx          ← Community + newsletter
│   │   ├── membership/page.tsx         ← Membership plans
│   │   ├── reservations/page.tsx       ← Table booking
│   │   ├── qr-menu/page.tsx            ← QR → menu redirect
│   │   ├── qr-review/page.tsx          ← QR → Google review
│   │   └── admin/
│   │       ├── page.tsx                ← Analytics dashboard
│   │       ├── menu/page.tsx           ← Menu manager + AI
│   │       └── qr/page.tsx             ← QR generator
│   ├── components/
│   │   ├── Navigation.tsx              ← Animated nav + mobile drawer
│   │   ├── Footer.tsx                  ← Full footer + marquee
│   │   ├── FloatingCTA.tsx             ← FAB: WhatsApp/LINE/Book
│   │   ├── home/
│   │   │   ├── HeroSection.tsx         ← Auto-rotating hero
│   │   │   ├── ManifestoSection.tsx    ← PLAY.RELAX.EAT.CONNECT
│   │   │   ├── ExperiencesSection.tsx  ← 4 pillars cards
│   │   │   ├── MenuPreview.tsx         ← Featured dishes
│   │   │   ├── EventsPreview.tsx       ← Upcoming events
│   │   │   ├── ReviewsSection.tsx      ← Google reviews
│   │   │   ├── GalleryTeaser.tsx       ← Gallery grid teaser
│   │   │   └── CTASection.tsx          ← Final booking CTA
│   │   └── menu/
│   │       ├── MenuPage.tsx            ← Full menu with search/filter
│   │       ├── MenuItemCard.tsx        ← Individual dish card
│   │       ├── MenuItemModal.tsx       ← Dish detail modal
│   │       └── TimeSlotBanner.tsx      ← Time-based suggestions
│   ├── lib/
│   │   ├── firebase.ts                 ← Firebase initialization
│   │   └── menuData.ts                 ← Menu items + categories
│   └── types/
│       └── index.ts                    ← TypeScript interfaces
└── .env.local                          ← Environment variables
```

---

## 🎨 Design System

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `padella-green` | #1B3A2D | Primary background |
| `padella-terracotta` | #C4634A | Accent, badges |
| `padella-cream` | #F5EFE0 | Text, light backgrounds |
| `padella-gold` | #C9A84C | CTAs, highlights, primary brand |
| `padella-wood` | #8B6340 | Warm accent |
| `padella-charcoal` | #1A1A1A | Dark sections |

### Typography
- **Display:** Playfair Display (headings, brand)
- **Body:** Inter (UI, descriptions)

---

## 🍽️ Menu System

### Time-Based Display Logic
```
07:00–11:00 → Breakfast featured
11:00–15:00 → Daily Specials + Pasta/Pizza
15:00–18:00 → Smoothies + Coffee
18:00–20:00 → Cocktails + Snacks (APERITIVO)
20:00–00:00 → Main Course + Pizza + Pasta
```

### Categories (16 total)
Breakfast · Daily Special · Snacks · Starters · Panini · Pizza · Pasta
Main Course · Salads · Fusion · Desserts · Soft Drinks · Smoothies
Coffee & Tea · Beer · Cocktails

### AI Photo Workflow (Admin)
1. Admin uploads photo on mobile
2. AI analyzes → enhances quality
3. Applies Padella visual style
4. Generates: name suggestion, description (EN), story
5. Admin reviews/edits → one-click publish

---

## 📊 Firestore Database Schema

```
/menu/{itemId}
  name, nameIt, description, story, pairing
  price, currency, category, tags
  image (Cloudinary URL), available, order
  isSpecial, isNew, isVegetarian, isVegan, isSpicy
  ingredients[], allergens[]

/events/{eventId}
  title, description, date, time, type
  image, price, maxAttendees, currentAttendees, available

/reviews/{reviewId}
  author, avatar, rating, text, date, source

/analytics/{date}
  pageViews, sessions, returningUsers
  menuViews{}, menuClicks{}
  whatsappClicks, lineClicks, bookingClicks
  qrMenuScans, qrReviewScans

/settings/timeSlots
  morning, lunch, afternoon, aperitivo, dinner
  (configurable from admin panel)

/members/{memberId}
  name, email, plan, joinDate, points

/newsletter/{email}
  email, subscribedAt, active
```

---

## 📱 QR Codes

| QR | Target | Placement |
|----|--------|-----------|
| Menu QR | `/qr-menu` → `/menu` | Tables, menus |
| Google Review QR | Google Review URL | Exit, receipts |
| WhatsApp QR | WhatsApp chat | Bar counter |
| Reservation QR | `/reservations` | Entrance |

---

## 🔍 SEO Strategy

**Primary keywords:**
- Italian restaurant Bangkok
- Best pizza Bangkok
- Best pasta Bangkok
- Padel club Bangkok
- Italian food Bangkok
- Cocktail bar Bangkok
- Italian brunch Bangkok

**Technical SEO:**
- ✅ XML Sitemap
- ✅ Robots.txt
- ✅ Open Graph + Twitter Cards
- ✅ Structured metadata per page
- ✅ Image optimization (WebP/AVIF)
- ✅ Mobile-first
- ✅ Fast loading (Next.js SSR/SSG)

---

## 🚀 Deployment Plan

### Phase 1 — Launch (Week 1–2)
- [ ] Configure Firebase project
- [ ] Add real photos + content
- [ ] Set up Google Analytics 4
- [ ] Configure WhatsApp & LINE numbers
- [ ] Deploy to Vercel
- [ ] Connect custom domain

### Phase 2 — Content (Week 3–4)
- [ ] Upload full menu with real photos
- [ ] Set up Google Reviews integration
- [ ] Add real event calendar
- [ ] Enable newsletter system

### Phase 3 — Features (Month 2)
- [ ] Implement Firebase real-time menu
- [ ] Loyalty program (points system)
- [ ] Online reservation system
- [ ] AI photo enhancement (Cloudinary)

---

## 💻 Development Setup

```bash
cd padella-bangkok

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Fill in Firebase + API keys

# Development
npm run dev

# Build
npm run build

# Start production
npm start
```

---

## 🔑 Required API Keys / Services

1. **Firebase** — Firestore + Storage + Auth
2. **Google Maps / Places API** — Reviews integration
3. **Cloudinary** — Image optimization + AI enhancement
4. **Google Analytics 4** — Analytics
5. **WhatsApp Business API** — Messaging
6. **LINE Official Account** — LINE integration

