import { MetadataRoute } from "next";

const BASE = process.env.SITE_URL ?? "http://localhost:3000";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function getMovieSlugs(): Promise<string[]> {
  try {
    // Fetch all movies in batches
    const slugs: string[] = [];
    let page = 1;
    while (true) {
      const res = await fetch(`${API}/movies?page=${page}&limit=100`, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const data = await res.json();
      if (!data.data?.length) break;
      slugs.push(...data.data.map((m: any) => m.slug));
      if (page >= data.totalPages) break;
      page++;
    }
    return slugs;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/movies`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/serials`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/multfilmlar`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const movieSlugs = await getMovieSlugs();
  const movieRoutes: MetadataRoute.Sitemap = movieSlugs.map((slug) => ({
    url: `${BASE}/movies/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...movieRoutes];
}
