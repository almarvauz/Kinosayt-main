import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { SeriesCard } from "@/components/series/series-card";
import { ChevronRight } from "lucide-react";

export async function SeriesTrendingRow() {
  let series;
  try {
    series = await apiClient.getSeriesTrending();
  } catch {
    return null;
  }

  if (!series?.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Trend Seriallar</h2>
        <Link href="/serials" className="flex items-center gap-1 text-sm text-brand-500 hover:underline">
          Hammasi <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {series.slice(0, 10).map((s) => (
          <SeriesCard key={s.id} series={s as any} />
        ))}
      </div>
    </section>
  );
}
