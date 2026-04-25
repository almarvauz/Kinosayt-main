import type { MovieDto } from "@kinosayt/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const SITE = process.env.SITE_URL ?? "http://localhost:3000";

export async function searchMovies(
  query: string,
  page = 1
): Promise<{ movies: MovieDto[]; total: number }> {
  // Try Elasticsearch first, fallback to Prisma
  const esUrl = `${API}/search?q=${encodeURIComponent(query)}&page=${page}&limit=5&sort=relevance`;
  try {
    const res = await fetch(esUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.data?.length > 0) return { movies: data.data, total: data.total };
    }
  } catch {}
  // Fallback to Prisma search
  const url = `${API}/movies?q=${encodeURIComponent(query)}&page=${page}&limit=5&sort=trending`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return { movies: data.data, total: data.total };
}

export async function getTrending(): Promise<MovieDto[]> {
  const res = await fetch(`${API}/movies/trending`);
  if (!res.ok) throw new Error("Failed to fetch trending");
  return res.json();
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  _count?: { movies: number };
}

export async function getGenres(): Promise<Genre[]> {
  const res = await fetch(`${API}/genres`);
  if (!res.ok) throw new Error("Failed to fetch genres");
  return res.json();
}

export async function getMoviesByGenre(
  genreSlug: string,
  page = 1
): Promise<{ movies: MovieDto[]; total: number; name: string }> {
  const url = `${API}/movies?genre=${encodeURIComponent(genreSlug)}&page=${page}&limit=5&sort=trending`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  let name = genreSlug;
  try {
    const genres = await getGenres();
    name = genres.find((g) => g.slug === genreSlug)?.name ?? genreSlug;
  } catch {}
  return { movies: data.data, total: data.total, name };
}

export async function getMovieStats(): Promise<{ totalMovies: number; totalGenres: number }> {
  const [moviesRes, genresRes] = await Promise.all([
    fetch(`${API}/movies?limit=1`),
    fetch(`${API}/genres`),
  ]);
  const moviesData = await moviesRes.json();
  const genresData = await genresRes.json();
  return {
    totalMovies: moviesData.total ?? 0,
    totalGenres: Array.isArray(genresData) ? genresData.length : 0,
  };
}

export type Lang = "uz" | "ru" | "en";

export function buildMovieCaption(movie: MovieDto, lang: Lang = "uz"): string {
  const genres = movie.genres.map((g) => `#${g.name.replace(/\s/g, "")}`).join(" ");
  const rating = movie.imdbRating ? `⭐ ${movie.imdbRating}/10` : "";
  const year = `📅 ${movie.year}`;

  const descLabels: Record<Lang, string> = {
    uz: "O'zbek tilida kino",
    ru: "Фильм на узбекском языке",
    en: "Movie in Uzbek language",
  };
  const description = movie.imdbDescription ?? descLabels[lang];

  return [
    `🎬 <b>${escHtml(movie.title)}</b>`,
    "",
    escHtml(description),
    "",
    `${year}${rating ? "  " + rating : ""}`,
    genres,
  ]
    .filter(Boolean)
    .join("\n");
}

export function watchUrl(slug: string): string {
  return `${SITE}/watch/${slug}`;
}

export function downloadUrl(slug: string): string {
  return `${SITE}/download/${slug}`;
}

export async function setMovieCode(slug: string, code: string | null): Promise<MovieDto> {
  const res = await fetch(`${API}/movies/${slug}/code`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function searchByCode(
  code: string,
  page = 1
): Promise<{ movies: MovieDto[]; total: number }> {
  const res = await fetch(`${API}/movies/by-code/${encodeURIComponent(code)}?page=${page}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export function escHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const SUPER_ADMIN_TOKEN = process.env.SUPER_ADMIN_TOKEN ?? "";

async function adminRequest(method: string, path: string, body?: unknown): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPER_ADMIN_TOKEN}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`Admin API error ${res.status}`);
  return res.status === 204 ? null : res.json();
}

export async function getR2Config(): Promise<{
  endpoint: string | null;
  accessKeyId: string | null;
  secretAccessKey: string | null;
  bucketName: string | null;
}> {
  // Fetch masked settings and show what's configured
  const all = await adminRequest("GET", "/settings");
  return {
    endpoint: all["R2_ENDPOINT"] ?? null,
    accessKeyId: all["R2_ACCESS_KEY_ID"] ?? null,
    secretAccessKey: all["R2_SECRET_ACCESS_KEY"] ?? null,
    bucketName: all["R2_BUCKET_NAME"] ?? null,
  };
}

export async function setR2Config(config: {
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
}): Promise<void> {
  await adminRequest("PUT", "/settings/r2/config", config);
}

export async function getStorageStatus(): Promise<{ configured: boolean }> {
  const res = await fetch(`${API}/storage/status`);
  if (!res.ok) return { configured: false };
  return res.json();
}
