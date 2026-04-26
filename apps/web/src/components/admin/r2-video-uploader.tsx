"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface UploadState {
  status: "idle" | "uploading" | "done" | "error";
  progress: number;
  key?: string;
  error?: string;
}

interface Props {
  onUploadComplete: (key: string, videoUrl: string) => void;
  label?: string;
}

export function R2VideoUploader({ onUploadComplete, label = "Video fayl" }: Props) {
  const [state, setState] = useState<UploadState>({ status: "idle", progress: 0 });
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) {
      setState({ status: "error", progress: 0, error: "Faqat video fayllar qabul qilinadi" });
      return;
    }

    setFileName(file.name);
    setState({ status: "uploading", progress: 0 });

    try {
      // 1. Get pre-signed upload URL from backend
      const res = await fetch("/api/storage/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!res.ok) throw new Error("Upload URL olishda xatolik");
      const { url, key, publicUrl } = await res.json();

      // 2. Upload directly to R2 with XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setState({ status: "uploading", progress: Math.round((e.loaded / e.total) * 100) });
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload xatosi: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Tarmoq xatosi"));
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Derive public-friendly key for display; backend will generate view URL on demand
      setState({ status: "done", progress: 100, key });
      onUploadComplete(key, publicUrl || key); // caller stores key, fetches view URL when needed
    } catch (err) {
      setState({ status: "error", progress: 0, error: (err as Error).message });
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[rgb(var(--fg))]">{label}</label>

      {state.status === "idle" || state.status === "error" ? (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-base rounded-2xl cursor-pointer hover:border-brand-500 hover:bg-brand-500/5 transition-colors"
          >
            <Upload className="w-8 h-8 text-[rgb(var(--muted))] mb-2" />
            <p className="text-sm text-[rgb(var(--muted))]">
              Bosing yoki faylni bu yerga torting
            </p>
            <p className="text-xs text-[rgb(var(--muted))]/60 mt-1">MP4, MKV, AVI — max 10GB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {state.status === "error" && (
            <p className="text-red-500 text-sm flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {state.error}
            </p>
          )}
        </>
      ) : state.status === "uploading" ? (
        <div className="space-y-2 p-4 bg-[rgb(var(--card))] rounded-2xl border border-base">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[rgb(var(--muted))] truncate max-w-xs">{fileName}</span>
            <span className="font-semibold text-brand-500 ml-2">{state.progress}%</span>
          </div>
          <div className="h-2 bg-[rgb(var(--bg))] rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-200"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted))]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Cloudflare R2 ga yuklanmoqda...
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Muvaffaqiyatli yuklandi!</p>
              <p className="text-xs text-[rgb(var(--muted))] mt-0.5 truncate max-w-xs">{state.key}</p>
            </div>
          </div>
          <button
            onClick={() => { setState({ status: "idle", progress: 0 }); setFileName(""); }}
            className="p-1 hover:bg-green-500/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
