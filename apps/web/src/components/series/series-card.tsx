"use client";

import Link from "next/link";
import Image from "next/image";
import type { SeriesDto } from "@kinosayt/types";
import { Star, Tv } from "lucide-react";

interface Props {
  series: Omit<SeriesDto, "seasons">;
}

export function SeriesCard({ series }: Props) {
  return (
    <Link href={`/serials/${series.slug}`} className="group block rounded-2xl overflow-hidden">
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-[rgb(var(--card))]">
        <div className="absolute inset-0 animate-pulse bg-[rgb(var(--card))]" />
        <Image
          src={series.posterUrl}
          alt={series.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <div className="flex items-center gap-2 text-white">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-500 shadow-lg">
              <Tv className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium">Ko&apos;rish</span>
          </div>
        </div>
        {/* Serial badge */}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-purple-600 text-white text-xs font-bold shadow">
          SERIAL
        </span>
        {series.imdbRating && (
          <span className="absolute top-2 right-2 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-black/60 text-yellow-400 text-xs font-semibold">
            <Star className="w-3 h-3 fill-yellow-400" />
            {series.imdbRating}
          </span>
        )}
      </div>

      <div className="pt-2.5 space-y-1.5 px-1">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-brand-500 transition-colors">
          {series.title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted">{series.year}</span>
          {series.genres?.[0] && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--card))] border border-base text-[rgb(var(--muted))]">
              {series.genres[0].name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
