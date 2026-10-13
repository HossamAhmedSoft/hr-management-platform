import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hr.gdgnctu.com";
  const locales = ["en", "ar"];

  const routes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/login", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/policy", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/teams", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/education", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/tasks", priority: 0.7, changeFrequency: "daily" as const },
    { path: "/points", priority: 0.7, changeFrequency: "daily" as const },
    { path: "/attendance", priority: 0.7, changeFrequency: "daily" as const },
    { path: "/evaluations", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/reports", priority: 0.6, changeFrequency: "weekly" as const },
    { path: "/members", priority: 0.6, changeFrequency: "weekly" as const },
    { path: "/appeals", priority: 0.5, changeFrequency: "weekly" as const },
    { path: "/feedback", priority: 0.5, changeFrequency: "weekly" as const },
    { path: "/incidents", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/hr-kpis", priority: 0.5, changeFrequency: "weekly" as const },
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const locale of locales) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: {
            en: `${baseUrl}/en${route.path}`,
            ar: `${baseUrl}/ar${route.path}`,
          },
        },
      });
    }
  }

  return sitemapEntries;
}
