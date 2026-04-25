"use client";

import { useState, type ReactNode } from "react";

interface CodeGateProps {
  slug: string;
  hasCode: boolean;
  children: ReactNode;
}

export function CodeGate({ slug, hasCode, children }: CodeGateProps) {
  const [unlocked, setUnlocked] = useState(!hasCode);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (unlocked) return <>{children}</>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/movies/${slug}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setUnlocked(true);
      } else {
        setError("Kod noto'g'ri");
      }
    } catch {
      setError("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-full max-w-sm bg-[rgb(var(--card))] rounded-2xl p-6 shadow-xl border border-[rgb(var(--border))]">
        <div className="text-center mb-6">
          <span className="text-4xl">🔐</span>
          <h2 className="text-xl font-bold mt-3">Kod talab qilinadi</h2>
          <p className="text-sm text-[rgb(var(--muted))] mt-1">
            Ushbu kinoni ko'rish uchun maxsus kod kiriting
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Kodni kiriting..."
            className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500"
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
          >
            {loading ? "Tekshirilmoqda..." : "Kirish"}
          </button>
        </form>
      </div>
    </div>
  );
}
