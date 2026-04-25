"use client";

import { useEffect, useState } from "react";

interface Props {
  videoUrl: string;
  title: string;
  isTelegram: boolean;
  uid?: string;
  slug: string;
}

export function DownloadHandler({ videoUrl, title, isTelegram, uid, slug }: Props) {
  const [status, setStatus] = useState<"pending" | "sending" | "sent" | "error">("pending");

  useEffect(() => {
    if (isTelegram && uid) {
      setStatus("sending");
      fetch(`/api/movies/${slug}/send-to-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: Number(uid), videoUrl }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) setStatus("sent");
          else setStatus("error");
        })
        .catch(() => setStatus("error"));
    } else {
      const a = document.createElement("a");
      a.href = videoUrl;
      a.download = `${title}.mp4`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setStatus("sent");
    }
  }, [isTelegram, uid, videoUrl, title, slug]);

  if (!isTelegram) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-black/80 text-white text-sm backdrop-blur-sm">
      {status === "sending" && "⏳ Telegramga yuborilmoqda..."}
      {status === "sent" && "✅ Telegram chatga yuborildi!"}
      {status === "error" && "❌ Yuborishda xatolik. Botga qarang."}
    </div>
  );
}
