import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://padellabangkok.com";
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/menu`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/padel`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/pool`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/events`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/community`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/membership`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
