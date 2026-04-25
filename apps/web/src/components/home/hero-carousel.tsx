"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import type { MovieDto } from "@kinosayt/types";
import { Play, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { GenreBadge } from "@/components/ui/genre-badge";

interface Props {
  movies: MovieDto[];
}

const SLIDE_INTERVAL = 6000;

export function HeroCarousel({ movies }: Props) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating || index === current) return;
      setIsAnimating(true);
      setCurrent(index);
      setTimeout(() => setIsAnimating(false), 600);
    },
    [isAnimating, current]
  );

  const next = useCallback(() => {
    goTo((current + 1) % movies.length);
  }, [current, movies.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + movies.length) % movies.length);
  }, [current, movies.length, goTo]);

  useEffect(() => {
    if (isPaused || movies.length <= 1) return;
    const timer = setInterval(next, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, next, movies.length]);

  if (!movies.length) return null;
  const featured = movies[current];

  return (
    <section
      className="relative w-full aspect-[21/9] min-h-[300px] max-h-[580px] overflow-hidden bg-black"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Blurred background — scale to hide blur edges */}
      {movies.map((movie, i) => (
        <div
          key={movie.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            className="object-cover scale-110 blur-sm opacity-40"
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/25 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

      {/* Content row */}
      <div className="absolute inset-0 flex items-center justify-between px-8 sm:px-12 lg:px-16">

        {/* Left: info */}
        <div className="flex-1 min-w-0 max-w-xl space-y-3 sm:space-y-4 pr-4 sm:pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            {featured.genres.slice(0, 2).map((g) => (
              <GenreBadge key={g.id} genre={g} asLink={false} />
            ))}
            {featured.year && (
              <span className="text-xs text-white/50 font-medium">{featured.year}</span>
            )}
          </div>

          <h1
            className={`text-white text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight line-clamp-2 transition-all duration-500 ${
              isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
            }`}
          >
            {featured.title}
          </h1>

          {featured.imdbDescription && (
            <p
              className={`text-white/65 text-sm sm:text-base line-clamp-2 transition-all duration-500 delay-75 ${
                isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              }`}
            >
              {featured.imdbDescription}
            </p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/movies/${featured.slug}`}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-semibold transition-colors shadow-lg shadow-brand-500/30 text-sm sm:text-base"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              Ko&apos;rish
            </Link>
            {featured.imdbRating && (
              <span className="flex items-center gap-1 text-yellow-400 font-semibold text-sm">
                <Star className="w-4 h-4 fill-yellow-400" />
                {featured.imdbRating}/10
              </span>
            )}
          </div>
        </div>

        {/* Right: full portrait poster card */}
        <div className="hidden sm:block flex-shrink-0 relative z-10">
          <Link href={`/movies/${featured.slug}`} tabIndex={-1} aria-hidden="true">
            <div
              className={`relative w-36 sm:w-44 lg:w-52 aspect-[2/3] rounded-2xl overflow-hidden
                shadow-[0_8px_40px_rgba(0,0,0,0.7)] ring-1 ring-white/15
                transition-all duration-500 hover:scale-105 hover:ring-white/30
                ${isAnimating ? "opacity-0 scale-95 translate-y-2" : "opacity-100 scale-100 translate-y-0"}`}
            >
              <Image
                src={featured.posterUrl}
                alt={featured.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 0px, (max-width: 1024px) 176px, 208px"
              />
              {/* Bottom rating badge */}
              {featured.imdbRating && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2 flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 flex-shrink-0 fill-yellow-400" />
                  <span className="text-white text-xs font-bold">{featured.imdbRating}</span>
                </div>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Prev / Next arrows */}
      {movies.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous"
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors border border-white/10 hover:border-white/30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next"
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors border border-white/10 hover:border-white/30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {movies.length > 1 && (
        <div className="absolute bottom-4 left-8 sm:left-12 lg:left-16 flex items-center gap-2 z-10">
          {movies.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 bg-brand-500"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
