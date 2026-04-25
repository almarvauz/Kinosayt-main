import type { MovieDto, PaginatedMovies, GenreDto, MovieFilters, CategoryDto } from "@kinosayt/types";

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
    // Use ES /search endpoint when a query is present, else fall back to /movies
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
};
