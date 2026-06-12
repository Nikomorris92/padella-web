import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import PublicChrome from "@/components/PublicChrome";
import SiteConfigProvider from "@/components/SiteConfigProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://padellabangkok.com"),
  title: {
    default: "Padella Bangkok — Italian Restaurant, Padel Club & Pool",
    template: "%s | Padella Bangkok",
  },
  description: "The ultimate Italian lifestyle destination in Bangkok. Authentic Italian cuisine, world-class padel courts, stunning pool, cocktail bar and vibrant community. Play. Relax. Eat. Connect.",
  keywords: ["Italian restaurant Bangkok", "Padel Club Bangkok", "Best pizza Bangkok", "Best pasta Bangkok", "Italian food Bangkok", "Cocktail Bangkok", "Italian brunch Bangkok", "Family restaurant Bangkok", "Pool Bangkok"],
  openGraph: {
    title: "Padella Bangkok — Play. Relax. Eat. Connect.",
    description: "The ultimate Italian lifestyle destination in Bangkok.",
    url: "https://padellabangkok.com",
    siteName: "Padella Bangkok",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Padella Bangkok",
    description: "Italian Restaurant, Padel Club & Pool in Bangkok",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SiteConfigProvider>
          <PublicChrome>{children}</PublicChrome>
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "#1B3A2D",
                color: "#F5EFE0",
                border: "1px solid rgba(201,168,76,0.3)",
                fontFamily: "Inter, sans-serif",
              },
            }}
          />
        </SiteConfigProvider>
      </body>
    </html>
  );
}
