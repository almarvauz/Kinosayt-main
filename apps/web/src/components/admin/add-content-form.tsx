"use client";

import { useState } from "react";
import { R2VideoUploader } from "./r2-video-uploader";
import { R2ImageUploader } from "./r2-image-uploader";
import { Film, Tv, Loader2, CheckCircle, AlertCircle, Zap } from "lucide-react";

type ContentType = "movie" | "series";

interface FormState {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
}

export function AdminAddContentForm() {
  const [type, setType] = useState<ContentType>("movie");
  const [formState, setFormState] = useState<FormState>({ status: "idle" });
  const [videoKey, setVideoKey] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [posterUrl, setPosterUrl] = useState("");
  const [posterKey, setPosterKey] = useState("");
  const [uploadPoster, setUploadPoster] = useState(false);
  const [imdbId, setImdbId] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [genreSlugs, setGenreSlugs] = useState("");
  const [isPremiere, setIsPremiere] = useState(false);

  // IMDb enrich
  const [enrichStatus, setEnrichStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function triggerEnrich() {
    if (!imdbId.trim()) return;
    setEnrichStatus("loading");
    try {
      const res = await fetch(`/api/scraper/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imdbId: imdbId.trim() }),
      });
      if (!res.ok) throw new Error("Enrich xatosi");
      setEnrichStatus("done");
    } catch {
      setEnrichStatus("error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!videoKey && type === "movie") {
      setFormState({ status: "error", message: "Video fayl yuklanmagan" });
      return;
    }
    setFormState({ status: "loading" });

    const slug = title.trim().toLowerCase()
      .replace(/[^a-z0-9\s\u0400-\u04FF]/g, "")
      .replace(/\s+/g, "-");

    const genres = genreSlugs.split(",").map((s) => s.trim()).filter(Boolean);

    const payload = {
      title: title.trim(),
      slug,
      year: parseInt(year),
      posterUrl: uploadPoster ? posterKey : posterUrl.trim(),
      videoUrl: videoKey,
      imdbId: imdbId.trim() || null,
      categorySlug: categorySlug.trim() || null,
      genres,
      isPremiere,
      type,
    };

    try {
      const res = await fetch(`/api/${type === "movie" ? "movies" : "series"}/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Server xatosi");
      }
      setFormState({ status: "success", message: `${type === "movie" ? "Kino" : "Serial"} muvaffaqiyatli qo'shildi!` });
      // Reset
      setTitle(""); setPosterUrl(""); setPosterKey(""); setImdbId(""); setGenreSlugs(""); setVideoKey(""); setIsPremiere(false);
    } catch (err) {
      setFormState({ status: "error", message: (err as Error).message });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type selector */}
      <div className="flex rounded-xl overflow-hidden border border-base">
        {(["movie", "series"] as ContentType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              type === t ? "bg-brand-500 text-white" : "hover:bg-[rgb(var(--card))]"
            }`}
          >
            {t === "movie" ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
            {t === "movie" ? "Kino" : "Serial"}
          </button>
        ))}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Sarlavha *</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Masalan: Avengers: Endgame"
          className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-base focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Year */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Yil *</label>
          <input
            required
            type="number"
            min={1900}
            max={2030}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-base focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Kategoriya</label>
          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-base focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
          >
            <option value="">— Tanlang —</option>
            <option value="uzbek">O&apos;zbek kino</option>
            <option value="xorij">Xorijiy</option>
            <option value="multfilm">Multfilm</option>
            <option value="hind">Hind kinosi</option>
            <option value="turk">Turk seriali</option>
          </select>
        </div>
      </div>

      {/* Poster URL or Upload */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Poster Rasm *</label>
          <button
            type="button"
            onClick={() => setUploadPoster(!uploadPoster)}
            className="text-xs text-brand-500 hover:text-brand-600 font-medium"
          >
            {uploadPoster ? "URL orqali kiritish" : "Rasm yuklash (R2)"}
          </button>
        </div>
        
        {uploadPoster ? (
          <R2ImageUploader
            onUploadComplete={(key) => { setPosterKey(key); setPosterUrl(""); }}
            label="Poster rasmini yuklash"
          />
        ) : (
          <input
            required
            value={posterUrl}
            onChange={(e) => setPosterUrl(e.target.value)}
            placeholder="https://image.tmdb.org/..."
            className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-base focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
          />
        )}
      </div>

      {/* IMDb ID + Enrich */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">IMDb ID</label>
        <div className="flex gap-2">
          <input
            value={imdbId}
            onChange={(e) => setImdbId(e.target.value)}
            placeholder="tt1234567"
            className="flex-1 px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-base focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
          />
          <button
            type="button"
            onClick={triggerEnrich}
            disabled={!imdbId.trim() || enrichStatus === "loading"}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-sm font-medium hover:bg-yellow-500/20 disabled:opacity-50 transition-colors"
          >
            {enrichStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {enrichStatus === "done" ? "Yuborildi!" : "IMDb Enrich"}
          </button>
        </div>
        <p className="text-xs text-[rgb(var(--muted))]">IMDb ID kiritilsa, reyting va tavsif avtomatik tortiladi.</p>
      </div>

      {/* Genres */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Janrlar (vergul bilan)</label>
        <input
          value={genreSlugs}
          onChange={(e) => setGenreSlugs(e.target.value)}
          placeholder="action, drama, comedy"
          className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-base focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
        />
      </div>

      {/* Premiere toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => setIsPremiere((v) => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors ${isPremiere ? "bg-brand-500" : "bg-[rgb(var(--card))] border border-base"}`}
        >
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPremiere ? "translate-x-6" : "translate-x-1"}`} />
        </div>
        <span className="text-sm font-medium">Premiere (maxsus belgilash)</span>
      </label>

      {/* Video upload — only for movies (series episodes added separately) */}
      {type === "movie" && (
        <R2VideoUploader
          onUploadComplete={(key, videoUrl) => setVideoKey(videoUrl)}
          label="Video faylni yuklash (R2)"
        />
      )}
      {type === "series" && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-sm text-purple-600 dark:text-purple-400">
          Serial qo&apos;shilgandan so&apos;ng, har bir fasl va epizodga alohida video yuklashingiz mumkin.
        </div>
      )}

      {/* Status messages */}
      {formState.status === "success" && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 dark:text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {formState.message}
        </div>
      )}
      {formState.status === "error" && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {formState.message}
        </div>
      )}

      <button
        type="submit"
        disabled={formState.status === "loading"}
        className="w-full flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl font-semibold transition-colors"
      >
        {formState.status === "loading" ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saqlanmoqda...</>
        ) : (
          <>{type === "movie" ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />} Qo&apos;shish</>
        )}
      </button>
    </form>
  );
}
