"use client";

import { useQuery } from "@tanstack/react-query";
import { MovieCard } from "@/components/movies/movie-card";
import { MovieGridSkeleton } from "@/components/ui/skeletons";
import type { PaginatedMovies } from "@kinosayt/types";

interface Props {
  query: string;
}

async function searchWithFallback(query: string): Promise<PaginatedMovies> {
  // Try Elasticsearch first via nginx proxy
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=40`);
    if (res.ok) {
      const data = await res.json();
      if (data.data?.length > 0) return data;
    }
  } catch {}
  // Fallback to Prisma text search via nginx proxy
  const res = await fetch(`/api/movies?q=${encodeURIComponent(query)}&limit=40&sort=trending`);
  return res.json();
}

export function SearchResults({ query }: Props) {
  const { data, isLoading } = useQuery<PaginatedMovies>({
    queryKey: ["search", query],
    queryFn: () => searchWithFallback(query),
    enabled: query.length > 0,
    staleTime: 30000,
  });

  if (!query) {
    return <p className="text-muted text-center py-16">Qidirish uchun narsa kiriting</p>;
  }

  if (isLoading) return <MovieGridSkeleton />;

  const movies = data?.data ?? [];

  if (movies.length === 0) {
    return (
      <p className="text-muted text-center py-16">
        &ldquo;{query}&rdquo; bo&apos;yicha natija topilmadi
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-muted mb-4">{data?.total} ta natija</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </>
  );
}
