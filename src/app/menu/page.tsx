import MenuPage from "@/components/menu/MenuPage";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Menu — Italian Cuisine, Pizza, Pasta, Cocktails",
  description: "Explore Padella Bangkok's full menu. Authentic Italian pasta, Neapolitan pizza, premium cocktails, fresh smoothies, and daily specials. Dine in or order via WhatsApp.",
};

export default function Page() {
  return <MenuPage />;
}
