import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { MovieCard } from "@/components/movies/movie-card";
import { ChevronRight } from "lucide-react";

export async function TrendingRow() {
  let movies;
  try {
    movies = await apiClient.getTrending();
  } catch {
    return null;
  }

  if (!movies?.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Trendda</h2>
        <Link href="/movies?sort=trending" className="flex items-center gap-1 text-sm text-brand-500 hover:underline">
          Hammasi <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {movies.slice(0, 10).map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
