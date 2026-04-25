import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { VideoPlayer } from "@/components/player/video-player";
import { GenreBadge } from "@/components/ui/genre-badge";
import { Star, Download } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { MovieDto } from "@kinosayt/types";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const movie = await apiClient.getMovie(params.slug);
    return {
      title: movie.title,
      description: movie.imdbDescription ?? movie.title,
      openGraph: {
        images: [{ url: movie.posterUrl }],
      },
    };
  } catch {
    return { title: "Kino topilmadi" };
  }
}

export default async function MoviePage({ params }: Props) {
  let movie: MovieDto;
  try {
    movie = await apiClient.getMovie(params.slug);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-shrink-0">
          <div className="relative w-full lg:w-72 aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl">
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 288px"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-5">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{movie.title}</h1>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-brand-500/10 text-brand-500">
              {movie.year}
            </span>
            {movie.imdbRating && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-400/10 text-yellow-500 font-semibold border border-yellow-400/20">
                <Star className="w-4 h-4 fill-current" />
                {movie.imdbRating}
              </div>
            )}
            {movie.category && (
              <span className="text-sm text-muted px-3 py-1 rounded-full border border-base">
                {movie.category.name}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {movie.genres.map((g) => (
              <GenreBadge key={g.id} genre={g} />
            ))}
          </div>

          {(movie.imdbDescription || movie.title) && (
            <p className="text-[rgb(var(--muted))] leading-relaxed text-base max-w-2xl">
              {movie.imdbDescription || `${movie.title} — O'zbek tilida`}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <VideoPlayer slug={movie.slug} videoUrl={movie.videoUrl} title={movie.title} />
        <div className="mt-4 flex justify-end">
          <a
            href={`/api/movies/${movie.slug}/download`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-lg"
          >
            <Download className="w-4 h-4" /> Yuklab olish
          </a>
        </div>
      </div>
    </div>
  );
}
