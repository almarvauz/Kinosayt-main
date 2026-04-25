import { apiClient } from "@/lib/api-client";
import { MovieCard } from "@/components/movies/movie-card";
import type { Metadata } from "next";
import { Suspense } from "react";
import { MovieGridSkeleton } from "@/components/ui/skeletons";
import { Smile } from "lucide-react";

export const metadata: Metadata = {
  title: "Multfilmlar",
  description: "O'zbek tilida eng yaxshi tarjima multfilmlar va animatsiyalar",
};

async function MultfilmGrid({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const { q, genre, year, page, sort } = searchParams;
  let result;
  try {
    result = await apiClient.getMovies({
      q,
      genre,
      category: "multfilm",          // fixed category filter
      year: year ? parseInt(year) : undefined,
      page: page ? parseInt(page) : 1,
      sort: (sort as any) ?? "newest",
      limit: 24,
    });
  } catch {
    return (
      <div className="text-center py-20 text-[rgb(var(--muted))]">
        Multfilmlarni yuklashda xatolik yuz berdi.
      </div>
    );
  }

  if (!result.data.length) {
    return (
      <div className="text-center py-20 text-[rgb(var(--muted))]">
        <Smile className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Hech qanday multfilm topilmadi.</p>
        <p className="text-sm mt-1">Bazaga hali multfilm qo&apos;shilmagan yoki filtr mos kelmadi.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Smile className="w-6 h-6 text-brand-500" />
          Multfilmlar{" "}
          <span className="text-base font-normal text-[rgb(var(--muted))]">
            ({result.total} ta)
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {result.data.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>

      {result.totalPages > 1 && (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {Array.from({ length: Math.min(result.totalPages, 10) }, (_, i) => {
            const p = i + 1;
            const params = new URLSearchParams({ ...searchParams, page: String(p) });
            params.delete("category");
            const isCurrent = p === (result.page ?? 1);
            return (
              <a
                key={p}
                href={`/multfilmlar?${params.toString()}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? "bg-brand-500 text-white"
                    : "bg-[rgb(var(--card))] border border-base hover:bg-brand-500/10"
                }`}
              >
                {p}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Genre filter sidebar variant for multfilmlar (no category filter, fixed to multfilm)
async function MultfilmGenreFilter({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  let genres: { id: number; name: string; slug: string }[] = [];
  try {
    genres = await apiClient.getGenres();
  } catch {}

  const activeGenre = searchParams.genre;
  const years = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];

  function buildLink(key: string, value: string) {
    const p = new URLSearchParams(searchParams as any);
    p.delete("category");
    if (p.get(key) === value) p.delete(key);
    else { p.set(key, value); p.delete("page"); }
    return `/multfilmlar?${p.toString()}`;
  }

  return (
    <div className="space-y-6 sticky top-24">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Janrlar</h3>
        <div className="flex flex-col gap-1">
          {genres.map((g) => (
            <a
              key={g.id}
              href={buildLink("genre", g.slug)}
              className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-sm transition-colors ${
                activeGenre === g.slug ? "bg-brand-500 text-white" : "hover:bg-[rgb(var(--card))]"
              }`}
            >
              {g.name}
            </a>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Yil</h3>
        <div className="flex flex-wrap gap-2">
          {years.map((y) => {
            const activeYear = searchParams.year;
            return (
              <a
                key={y}
                href={buildLink("year", String(y))}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                  activeYear === String(y)
                    ? "bg-brand-500 border-brand-500 text-white"
                    : "border-base hover:border-brand-500 hover:text-brand-500"
                }`}
              >
                {y}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MultfilmlarPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <Suspense fallback={null}>
            <MultfilmGenreFilter searchParams={searchParams} />
          </Suspense>
        </aside>
        <div className="flex-1 min-w-0">
          <Suspense fallback={<MovieGridSkeleton />}>
            <MultfilmGrid searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
