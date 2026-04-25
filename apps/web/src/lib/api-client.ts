import type { MovieDto, PaginatedMovies, GenreDto, MovieFilters, CategoryDto, SeriesDto, PaginatedSeries } from "@kinosayt/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate: 60 },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

function buildQuery(filters: MovieFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.category) params.set("category", filters.category);
  if (filters.year) params.set("year", String(filters.year));
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.sort) params.set("sort", filters.sort);
  const str = params.toString();
  return str ? `?${str}` : "";
}

export const apiClient = {
  getMovies(filters: MovieFilters = {}): Promise<PaginatedMovies> {
    return request(`/movies${buildQuery(filters)}`);
  },

  /** Elasticsearch-powered fuzzy search */
  searchMovies(filters: MovieFilters = {}): Promise<PaginatedMovies> {
    if (filters.q) {
      return request(`/search${buildQuery(filters)}`, { next: { revalidate: 30 } });
    }
    return request(`/movies${buildQuery(filters)}`);
  },

  getMovie(slug: string): Promise<MovieDto> {
    return request(`/movies/${slug}`, { next: { revalidate: 3600 } });
  },

  getTrending(): Promise<MovieDto[]> {
    return request("/movies/trending", { next: { revalidate: 60 } });
  },

  getGenres(): Promise<GenreDto[]> {
    return request("/genres", { next: { revalidate: 3600 } });
  },

  getCategories(): Promise<CategoryDto[]> {
    return request("/categories", { next: { revalidate: 3600 } });
  },

  incrementView(slug: string): Promise<void> {
    return request(`/movies/${slug}/view`, {
      method: "POST",
      next: { revalidate: 0 },
    });
  },

  // ─── Series ──────────────────────────────────────────────────
  getSeries(filters: MovieFilters = {}): Promise<PaginatedSeries> {
    return request(`/series${buildQuery(filters)}`);
  },

  getSeriesTrending(): Promise<SeriesDto[]> {
    return request("/series/trending", { next: { revalidate: 60 } });
  },

  getSerie(slug: string): Promise<SeriesDto> {
    return request(`/series/${slug}`, { next: { revalidate: 3600 } });
  },

  incrementSeriesView(slug: string): Promise<void> {
    return request(`/series/${slug}/view`, { method: "POST", next: { revalidate: 0 } });
  },

  getEpisodeStream(slug: string, season: number, episode: number): Promise<{ videoUrl: string }> {
    return request(`/series/${slug}/season/${season}/episode/${episode}/stream`);
  },

  // ─── Storage (Cloudflare R2) ──────────────────────────────────
  /** Get a pre-signed upload URL. Returns { url, key }. */
  getUploadUrl(filename: string, contentType: string): Promise<{ url: string; key: string }> {
    return request("/storage/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, contentType }),
    });
  },

  /** Get a pre-signed view URL for a stored R2 key. Valid for 3 hours. */
  getViewUrl(key: string): Promise<{ url: string }> {
    return request(`/storage/view-url?key=${encodeURIComponent(key)}`);
  },
};
