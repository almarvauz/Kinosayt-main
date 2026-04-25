"use client";

import { useEffect } from "react";

interface Props {
  slug: string;
  title: string;
}

export function DownloadRedirect({ slug, title }: Props) {
  const downloadPath = `/api/movies/${slug}/download`;

  useEffect(() => {
    // Detect Telegram WebView
    const isTgWebView =
      typeof window !== "undefined" &&
      (navigator.userAgent.includes("Telegram") ||
        (window as any).TelegramWebviewProxy != null);

    if (isTgWebView) {
      // In Telegram, open in external browser so download works
      const fullUrl = window.location.origin + downloadPath;
      try {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.openLink) {
          tg.openLink(fullUrl);
          return;
        }
      } catch {}
      window.open(fullUrl, "_blank");
    } else {
      // Normal browser — trigger download directly
      window.location.href = downloadPath;
    }
  }, [slug, downloadPath]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white gap-6 p-6">
      <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      <p className="text-lg font-semibold text-center">{title}</p>
      <p className="text-sm text-white/60">Yuklab olish boshlanmoqda...</p>
      <a
        href={downloadPath}
        className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors"
      >
        📥 Yuklab olish
      </a>
      <p className="text-xs text-white/40 mt-2">
        Agar yuklanish boshlanmasa, tugmani bosing
      </p>
    </div>
  );
}
