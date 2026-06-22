import HeroSection from "@/components/home/HeroSection";
import ManifestoSection from "@/components/home/ManifestoSection";
import ExperiencesSection from "@/components/home/ExperiencesSection";
import MenuPreview from "@/components/home/MenuPreview";
import ReviewsSection from "@/components/home/ReviewsSection";
import GalleryTeaser from "@/components/home/GalleryTeaser";
import CTASection from "@/components/home/CTASection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Padella Bangkok — Play. Relax. Eat. Connect.",
  description: "Italian Restaurant, Padel Club & Pool in Bangkok. Authentic Italian cuisine, world-class padel courts, and the best aperitivo in the city.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ManifestoSection />
      <ExperiencesSection />
      <MenuPreview />
      <ReviewsSection />
      <GalleryTeaser />
      <CTASection />
    </>
  );
}
