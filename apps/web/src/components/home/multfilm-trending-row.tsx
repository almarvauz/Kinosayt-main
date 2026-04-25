import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { MovieCard } from "@/components/movies/movie-card";
import { ChevronRight, Smile } from "lucide-react";

export async function MultfilmTrendingRow() {
  let result;
  try {
    result = await apiClient.getMovies({ category: "multfilm", limit: 10, sort: "trending" });
  } catch {
    return null;
  }

  if (!result?.data?.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Smile className="w-5 h-5 text-brand-500" />
          Trend Multfilmlar
        </h2>
        <Link href="/multfilmlar" className="flex items-center gap-1 text-sm text-brand-500 hover:underline">
          Hammasi <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {result.data.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
