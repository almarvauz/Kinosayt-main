import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { MovieCard } from "@/components/movies/movie-card";
import { ChevronRight } from "lucide-react";

export async function GenreRows() {
  let genres;
  try {
    genres = await apiClient.getGenres();
  } catch {
    return null;
  }

  const rows = await Promise.allSettled(
    genres.slice(0, 4).map((g) =>
      apiClient.getMovies({ genre: g.slug, limit: 6, sort: "trending" }).then((r) => ({
        genre: g,
        movies: r.data,
      }))
    )
  );

  return (
    <>
      {rows.map((row) => {
        if (row.status !== "fulfilled" || row.value.movies.length === 0) return null;
        const { genre, movies } = row.value;
        return (
          <section key={genre.id}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{genre.name}</h2>
              <Link href={`/movies?genre=${genre.slug}`} className="flex items-center gap-1 text-sm text-brand-500 hover:underline">
                Hammasi <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
