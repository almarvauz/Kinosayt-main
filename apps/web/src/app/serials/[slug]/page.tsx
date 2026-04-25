import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { apiClient } from "@/lib/api-client";
import type { SeriesDto } from "@kinosayt/types";
import { Star, Tv, ChevronRight, Play } from "lucide-react";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const series = await apiClient.getSerie(params.slug);
    return {
      title: series.title,
      description: series.imdbDescription ?? series.title,
      openGraph: { images: [{ url: series.posterUrl }] },
    };
  } catch {
    return { title: "Serial topilmadi" };
  }
}

export default async function SerialDetailPage({ params }: Props) {
  let series: SeriesDto;
  try {
    series = await apiClient.getSerie(params.slug);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[rgb(var(--muted))] mb-6">
        <Link href="/" className="hover:text-[rgb(var(--fg))] transition-colors">Bosh sahifa</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/serials" className="hover:text-[rgb(var(--fg))] transition-colors">Seriallar</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[rgb(var(--fg))] font-medium line-clamp-1">{series.title}</span>
      </nav>

      {/* Hero info */}
      <div className="flex flex-col lg:flex-row gap-8 mb-10">
        {/* Poster */}
        <div className="flex-shrink-0">
          <div className="relative w-full lg:w-64 aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src={series.posterUrl}
              alt={series.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 256px"
            />
          </div>
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0 space-y-5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-purple-600/10 text-purple-500 text-xs font-bold border border-purple-500/20 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5" /> SERIAL
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{series.title}</h1>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-brand-500/10 text-brand-500">
              {series.year}
            </span>
            {series.imdbRating && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-400/10 text-yellow-500 font-semibold border border-yellow-400/20">
                <Star className="w-4 h-4 fill-current" />
                {series.imdbRating}
              </div>
            )}
            {series.category && (
              <span className="text-sm text-muted px-3 py-1 rounded-full border border-base">
                {series.category.name}
              </span>
            )}
            <span className="text-sm text-muted px-3 py-1 rounded-full border border-base">
              {series.seasons?.length ?? 0} fasl
            </span>
          </div>

          {series.genres?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {series.genres.map((g) => (
                <Link
                  key={g.id}
                  href={`/serials?genre=${g.slug}`}
                  className="text-xs px-3 py-1 rounded-full bg-[rgb(var(--card))] border border-base hover:border-brand-500/50 hover:text-brand-500 transition-colors"
                >
                  {g.name}
                </Link>
              ))}
            </div>
          )}

          {series.imdbDescription && (
            <p className="text-[rgb(var(--muted))] leading-relaxed text-base max-w-2xl">
              {series.imdbDescription}
            </p>
          )}
        </div>
      </div>

      {/* Seasons & Episodes */}
      {series.seasons?.length > 0 ? (
        <div className="space-y-8">
          <h2 className="text-xl font-bold border-b border-base pb-3">Fasllar va qismlar</h2>
          {series.seasons.map((season) => (
            <div key={season.id} className="rounded-2xl bg-[rgb(var(--card))] border border-base overflow-hidden">
              <div className="px-5 py-4 border-b border-base bg-[rgb(var(--bg))]/50">
                <h3 className="font-semibold text-base">{season.seasonNumber}-fasl</h3>
                <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
                  {season.episodes?.length ?? 0} ta qism
                </p>
              </div>
              <div className="divide-y divide-base">
                {season.episodes?.map((ep) => (
                  <Link
                    key={ep.id}
                    href={`/serials/${series.slug}/watch?season=${season.seasonNumber}&episode=${ep.episodeNumber}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-brand-500/5 transition-colors group"
                  >
                    <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[rgb(var(--bg))] border border-base text-sm font-bold group-hover:bg-brand-500 group-hover:text-white group-hover:border-brand-500 transition-all flex-shrink-0">
                      <Play className="w-4 h-4 ml-0.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-brand-500 transition-colors">
                        {ep.episodeNumber}-qism{ep.title ? ` — ${ep.title}` : ""}
                      </p>
                      {ep.viewCount > 0 && (
                        <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
                          {ep.viewCount.toLocaleString()} ko&apos;rilgan
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-[rgb(var(--muted))] group-hover:text-brand-500 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[rgb(var(--muted))]">
          <Tv className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Bu serial uchun hali qismlar qo&apos;shilmagan.</p>
        </div>
      )}
    </div>
  );
}
