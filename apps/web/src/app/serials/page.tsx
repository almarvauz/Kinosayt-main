import { apiClient } from "@/lib/api-client";
import { SeriesCard } from "@/components/series/series-card";
import { FilterSidebar } from "@/components/movies/filter-sidebar";
import type { Metadata } from "next";
import { Suspense } from "react";
import { MovieGridSkeleton } from "@/components/ui/skeletons";

export const metadata: Metadata = {
  title: "Seriallar",
  description: "O'zbek tilida eng yaxshi tarjima seriallar",
};

async function SeriesGrid({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const { q, genre, category, year, page, sort } = searchParams;
  let result;
  try {
    result = await apiClient.getSeries({
      q,
      genre,
      category,
      year: year ? parseInt(year) : undefined,
      page: page ? parseInt(page) : 1,
      sort: (sort as any) ?? "newest",
      limit: 24,
    });
  } catch {
    return (
      <div className="text-center py-20 text-[rgb(var(--muted))]">
        Seriallarni yuklashda xatolik yuz berdi.
      </div>
    );
  }

  if (!result.data.length) {
    return (
      <div className="text-center py-20 text-[rgb(var(--muted))]">
        Hech qanday serial topilmadi.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Seriallar{" "}
          <span className="text-base font-normal text-[rgb(var(--muted))]">
            ({result.total} ta)
          </span>
        </h1>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {result.data.map((series) => (
          <SeriesCard key={series.id} series={series} />
        ))}
      </div>

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: Math.min(result.totalPages, 10) }, (_, i) => {
            const p = i + 1;
            const params = new URLSearchParams(searchParams as any);
            params.set("page", String(p));
            const isCurrent = p === (result.page ?? 1);
            return (
              <a
                key={p}
                href={`/serials?${params.toString()}`}
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

export default function SerialsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <Suspense fallback={null}>
            <FilterSidebar />
          </Suspense>
        </aside>
        <div className="flex-1 min-w-0">
          <Suspense fallback={<MovieGridSkeleton />}>
            <SeriesGrid searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
