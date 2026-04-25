import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE = process.env.SITE_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/movies/", "/serials/", "/multfilmlar/", "/search"],
        disallow: ["/admin", "/watch/", "/download/", "/api/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
