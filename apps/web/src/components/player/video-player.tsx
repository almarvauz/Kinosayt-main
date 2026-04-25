"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface QualityOption {
  quality: number;
  url: string;
  label: string;
}

interface Props {
  slug: string;
  videoUrl: string;
  title: string;
  fullscreen?: boolean;
}

export function VideoPlayer({ slug, videoUrl, title, fullscreen = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const viewTracked = useRef(false);

  const [qualities, setQualities] = useState<QualityOption[] | null>(null);

  // --- Double-tap skip state ---
  const [skipIndicator, setSkipIndicator] = useState<{ side: "left" | "right"; key: number } | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  useEffect(() => {
    let cancelled = false;
    const qMatch = videoUrl.match(/_(\d+)\.mp4$/i);
    const originalQ = qMatch ? parseInt(qMatch[1]) : 720;

    fetch(`/api/movies/${slug}/qualities`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.qualities?.length > 0) {
          setQualities(data.qualities);
        } else {
          setQualities([{ quality: originalQ, url: videoUrl, label: `${originalQ}p` }]);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setQualities([{ quality: originalQ, url: videoUrl, label: `${originalQ}p` }]);
      });

    return () => { cancelled = true; };
  }, [slug, videoUrl]);

  // Initialize Plyr
  useEffect(() => {
    if (!qualities || !videoRef.current) return;
    let destroyed = false;

    import("plyr").then((mod) => {
      if (destroyed || !videoRef.current) return;
      const PlyrClass = mod.default ?? (mod as any);

      const qualityOptions = qualities.map((q) => q.quality);

      const p = new PlyrClass(videoRef.current, {
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "mute",
          "volume",
          "settings",
          "pip",
          "fullscreen",
        ],
        settings: ["quality", "speed"],
        quality: {
          default: qualities.find((q) => q.quality <= 720)?.quality ?? qualities[0].quality,
          options: qualityOptions,
          forced: true,
          onChange: (newQuality: number) => {
            changeQuality(newQuality);
          },
        },
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
        keyboard: { focused: true, global: true },
        tooltips: { controls: true, seek: true },
        fullscreen: { enabled: true, fallback: true, iosNative: true },
        i18n: {
          qualityLabel: { 0: "Auto" },
        },
      });

      playerRef.current = p;

      p.source = {
        type: "video" as const,
        sources: qualities.map((q) => ({
          src: q.url,
          type: "video/mp4",
          size: q.quality,
        })),
      };

      p.on("play", () => {
        if (!viewTracked.current) {
          viewTracked.current = true;
          fetch(`/api/movies/${slug}/view`, { method: "POST" }).catch(() => {});
        }
      });
    });

    function changeQuality(newQuality: number) {
      const p = playerRef.current;
      if (!p) return;
      const match = qualities!.find((q) => q.quality === newQuality);
      if (!match) return;

      const currentTime = p.currentTime || 0;
      const wasPlaying = !p.paused;

      const video = p.media as HTMLVideoElement;
      if (video) {
        video.src = match.url;
        video.load();
        const onLoaded = () => {
          video.removeEventListener("loadedmetadata", onLoaded);
          if (currentTime > 0) video.currentTime = currentTime;
          if (wasPlaying) video.play().catch(() => {});
        };
        video.addEventListener("loadedmetadata", onLoaded);
      }
    }

    return () => {
      destroyed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [qualities, slug]);

  // --- Double-tap handler for mobile ---
  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const video = playerRef.current;
    if (!container || !video) return;

    const touch = e.changedTouches[0];
    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const now = Date.now();

    const dt = now - lastTap.current.time;
    const dx = Math.abs(x - lastTap.current.x);

    if (dt < 350 && dx < 80) {
      // Double-tap detected
      e.preventDefault();
      const isRight = x > rect.width / 2;
      const skipSec = 10;

      if (isRight) {
        video.forward(skipSec);
      } else {
        video.rewind(skipSec);
      }

      setSkipIndicator({ side: isRight ? "right" : "left", key: now });
      lastTap.current = { time: 0, x: 0 };
    } else {
      lastTap.current = { time: now, x };
    }
  }, []);

  // Clear skip indicator after animation
  useEffect(() => {
    if (!skipIndicator) return;
    const t = setTimeout(() => setSkipIndicator(null), 600);
    return () => clearTimeout(t);
  }, [skipIndicator]);

  return (
    <>
      <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
      <div
        ref={containerRef}
        onTouchEnd={handleTouchEnd}
        className={`relative ${fullscreen ? "w-full" : "w-full rounded-2xl overflow-hidden shadow-2xl"}`}
      >
        {!qualities ? (
          <div className="w-full aspect-video bg-black/80 animate-pulse rounded-2xl flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <video
            ref={videoRef}
            className="plyr-react plyr"
            playsInline
            preload="metadata"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        )}

        {/* Double-tap skip indicator */}
        {skipIndicator && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 pointer-events-none animate-fade-out ${
              skipIndicator.side === "right" ? "right-8" : "left-8"
            }`}
          >
            <div className="bg-black/60 text-white rounded-full w-16 h-16 flex items-center justify-center">
              <span className="text-sm font-bold">
                {skipIndicator.side === "right" ? "+10s" : "-10s"}
              </span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeOut {
          0% { opacity: 1; transform: translateY(-50%) scale(1.2); }
          100% { opacity: 0; transform: translateY(-50%) scale(1); }
        }
        .animate-fade-out {
          animation: fadeOut 0.6s ease-out forwards;
        }
      `}</style>
      <style jsx global>{`
        /* Fullscreen: fill entire screen on all browsers */
        .plyr:fullscreen video,
        .plyr:-webkit-full-screen video,
        .plyr:-moz-full-screen video {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain;
        }
        .plyr:fullscreen,
        .plyr:-webkit-full-screen,
        .plyr:-moz-full-screen {
          width: 100vw !important;
          height: 100vh !important;
          background: #000;
        }
        /* Plyr fallback fullscreen (no native API) */
        .plyr--fullscreen-fallback {
          position: fixed !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 9999999 !important;
          background: #000 !important;
        }
        .plyr--fullscreen-fallback video {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain;
        }
        /* iOS native fullscreen */
        video::-webkit-media-controls-fullscreen-button {
          display: block;
        }
      `}</style>
    </>
  );
}
