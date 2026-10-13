import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hr.gdgnctu.com";

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/en",
        "/ar",
        "/en/login",
        "/ar/login",
        "/en/policy",
        "/ar/policy",
      ],
      disallow: [
        "/api/",
        "/en/audit-log",
        "/ar/audit-log",
        "/en/forbidden",
        "/ar/forbidden",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
