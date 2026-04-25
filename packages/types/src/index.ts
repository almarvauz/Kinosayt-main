export interface GenreDto {
  id: number;
  name: string;
  slug: string;
  _count?: { movies: number };
}

export interface CategoryDto {
  id: number;
  name: string;
  slug: string;
}

export interface MovieDto {
  id: number;
  externalId: number;
  title: string;
  slug: string;
  videoUrl: string;
  posterUrl: string;
  year: number;
  isPremiere: boolean;
  premiereUntil: string | null;
  imdbRating: number | null;
  imdbDescription: string | null;
  imdbId: string | null;
  viewCount: number;
  category: CategoryDto | null;
  genres: GenreDto[];
  createdAt: string;
}

export interface EpisodeDto {
  id: number;
  episodeNumber: number;
  title: string | null;
  videoUrl: string;
  viewCount: number;
  createdAt: string;
}

export interface SeasonDto {
  id: number;
  seasonNumber: number;
  episodes: EpisodeDto[];
}

export interface SeriesDto {
  id: number;
  title: string;
  slug: string;
  posterUrl: string;
  year: number;
  imdbRating: number | null;
  imdbDescription: string | null;
  imdbId: string | null;
  viewCount: number;
  category: CategoryDto | null;
  genres: GenreDto[];
  seasons: SeasonDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedMovies {
  data: MovieDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedSeries {
  data: Omit<SeriesDto, "seasons">[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MovieFilters {
  q?: string;
  genre?: string;
  category?: string;
  year?: number;
  page?: number;
  limit?: number;
  sort?: "newest" | "oldest" | "trending" | "rating";
}

export interface TelegramWebAppInitData {
  query_id?: string;
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  auth_date: number;
  hash: string;
}
