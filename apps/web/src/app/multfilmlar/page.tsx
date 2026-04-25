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

async function MultfilmGrid({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const { q, genre, year, page, sort } = searchParams;
  let result;
  try {
    result = await apiClient.getMovies({
      q, genre,
      category: "multfilm",
      year: year ? parseInt(year) : undefined,
      page: page ? parseInt(page) : 1,
      sort: (sort as any) ?? "newest",
      limit: 24,
    });
  } catch {
    return <div className="text-center py-20 text-[rgb(var(--muted))]">Multfilmlarni yuklashda xatolik yuz berdi.</div>;
  }

  if (!result.data.length) {
    return (
      <div className="text-center py-20 text-[rgb(var(--muted))]">
        <Smile className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Hech qanday multfilm topilmadi.</p>
        <p className="text-sm mt-1">Bazaga hali multfilm qo&apos;shilmagan.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Smile className="w-6 h-6 text-brand-500" />
          Multfilmlar <span className="text-base font-normal text-[rgb(var(--muted))]">({result.total} ta)</span>
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
              <a key={p} href={`/multfilmlar?${params.toString()}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isCurrent ? "bg-brand-500 text-white" : "bg-[rgb(var(--card))] border border-base hover:bg-brand-500/10"}`}>
                {p}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MultfilmlarPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<MovieGridSkeleton />}>
        <MultfilmGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
