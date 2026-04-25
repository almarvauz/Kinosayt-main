import { notFound } from "next/navigation";
import Link from "next/link";
import { VideoPlayer } from "@/components/player/video-player";
import { apiClient } from "@/lib/api-client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  params: { slug: string };
  searchParams: { season?: string; episode?: string };
}

export default async function SerialWatchPage({ params, searchParams }: Props) {
  const seasonNum = parseInt(searchParams.season ?? "1");
  const episodeNum = parseInt(searchParams.episode ?? "1");

  let series;
  let videoUrl: string;

  try {
    series = await apiClient.getSerie(params.slug);
  } catch {
    notFound();
  }

  try {
    const stream = await apiClient.getEpisodeStream(params.slug, seasonNum, episodeNum);
    videoUrl = stream.videoUrl;
  } catch {
    notFound();
  }

  const currentSeason = series.seasons?.find((s) => s.seasonNumber === seasonNum);
  const currentEp = currentSeason?.episodes?.find((e) => e.episodeNumber === episodeNum);

  // Prev / Next episode navigation
  const episodes = currentSeason?.episodes ?? [];
  const epIdx = episodes.findIndex((e) => e.episodeNumber === episodeNum);
  const prevEp = epIdx > 0 ? episodes[epIdx - 1] : null;
  const nextEp = epIdx < episodes.length - 1 ? episodes[epIdx + 1] : null;

  const title = `${series.title} — ${seasonNum}-fasl ${episodeNum}-qism${currentEp?.title ? ` (${currentEp.title})` : ""}`;

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-black/60 backdrop-blur-sm border-b border-white/10">
        <Link
          href={`/serials/${params.slug}`}
          className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{series.title}</span>
        </Link>
        <span className="text-white/30 text-sm">|</span>
        <p className="text-sm text-white/80 font-medium truncate flex-1">{title}</p>
      </div>

      {/* Player */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-5xl px-4">
          <VideoPlayer slug={params.slug} videoUrl={videoUrl} title={title} fullscreen />
        </div>
      </div>

      {/* Episode navigation */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-black/60 backdrop-blur-sm border-t border-white/10">
        {prevEp ? (
          <Link
            href={`/serials/${params.slug}/watch?season=${seasonNum}&episode=${prevEp.episodeNumber}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{prevEp.episodeNumber}-qism</span>
          </Link>
        ) : (
          <div />
        )}

        <p className="text-white/60 text-xs text-center">
          {seasonNum}-fasl • {episodeNum}/{episodes.length} qism
        </p>

        {nextEp ? (
          <Link
            href={`/serials/${params.slug}/watch?season=${seasonNum}&episode=${nextEp.episodeNumber}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
          >
            <span className="hidden sm:inline">{nextEp.episodeNumber}-qism</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
