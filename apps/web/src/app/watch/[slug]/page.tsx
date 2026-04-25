import { notFound } from "next/navigation";
import { VideoPlayer } from "@/components/player/video-player";
import { apiClient } from "@/lib/api-client";
import type { MovieDto } from "@kinosayt/types";

interface Props {
  params: { slug: string };
}

export default async function WatchPage({ params }: Props) {
  let movie: MovieDto;
  try {
    movie = await apiClient.getMovie(params.slug);
  } catch {
    notFound();
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-5xl px-4">
          <VideoPlayer
            slug={movie.slug}
            videoUrl={movie.videoUrl}
            title={movie.title}
            fullscreen
          />
        </div>
      </div>
      <div className="p-4 text-white text-center flex items-center justify-center gap-4">
        <p className="text-lg font-semibold">{movie.title}</p>
        <a
          href={`/api/movies/${movie.slug}/download`}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-medium transition-colors"
        >
          📥 Yuklab olish
        </a>
      </div>
    </div>
  );
}
