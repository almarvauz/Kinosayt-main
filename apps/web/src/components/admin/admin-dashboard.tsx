"use client";

import { useState } from "react";
import { AdminAddContentForm } from "./add-content-form";
import {
  Film,
  Tv,
  BarChart3,
  PlusCircle,
  Settings,
  Shield,
  TrendingUp,
  Database,
  Globe,
  Loader2,
  CheckCircle,
} from "lucide-react";

type Tab = "add" | "stats" | "settings" | "site";

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-[rgb(var(--card))] rounded-2xl border border-base">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-[rgb(var(--muted))] uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("add");
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Site settings state
  const [siteName, setSiteName] = useState("");
  const [telegramChannel, setTelegramChannel] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [siteStatus, setSiteStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  // Simple frontend PIN guard (real security is on the API level)
  const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "1234";

  const SUPER_ADMIN_TOKEN = process.env.NEXT_PUBLIC_SUPER_ADMIN_TOKEN || "";
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  async function saveSiteSettings(e: React.FormEvent) {
    e.preventDefault();
    setSiteStatus("loading");
    try {
      const res = await fetch(`${API}/settings/site/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPER_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          siteName: siteName || undefined,
          telegramChannel: telegramChannel || undefined,
          siteDescription: siteDescription || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setSiteStatus("ok");
      setTimeout(() => setSiteStatus("idle"), 2500);
    } catch {
      setSiteStatus("error");
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-[rgb(var(--card))] rounded-3xl p-8 border border-base shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/10 mb-4">
              <Shield className="w-8 h-8 text-brand-500" />
            </div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">PIN kodini kiriting</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError(false); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (pin === ADMIN_PIN) setUnlocked(true);
                  else setPinError(true);
                }
              }}
              placeholder="PIN kodi"
              className={`w-full px-4 py-3 rounded-xl bg-[rgb(var(--bg))] border text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors ${
                pinError ? "border-red-500" : "border-base"
              }`}
              autoFocus
            />
            {pinError && <p className="text-red-500 text-sm text-center">Noto&apos;g&apos;ri PIN</p>}
            <button
              onClick={() => {
                if (pin === ADMIN_PIN) setUnlocked(true);
                else setPinError(true);
              }}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold transition-colors"
            >
              Kirish
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-500" />
            Admin Panel
          </h1>
          <p className="text-sm text-[rgb(var(--muted))] mt-1">Kinosayt boshqaruv markazi</p>
        </div>
        <button
          onClick={() => setUnlocked(false)}
          className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors px-3 py-1.5 rounded-xl border border-base"
        >
          Chiqish
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Film} label="Kinolar" value="5,500+" color="bg-blue-500" />
        <StatCard icon={Tv} label="Seriallar" value="0" color="bg-purple-500" />
        <StatCard icon={TrendingUp} label="Bugungi ko'rishlar" value="—" color="bg-green-500" />
        <StatCard icon={Database} label="R2 Storage" value="Active" color="bg-orange-500" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[rgb(var(--card))] border border-base rounded-2xl w-fit mb-6">
        {([
          { id: "add", label: "Kontent qo'shish", icon: PlusCircle },
          { id: "stats", label: "Statistika", icon: BarChart3 },
          { id: "site", label: "Sayt sozlamalari", icon: Globe },
          { id: "settings", label: "Tizim sozlamalari", icon: Settings },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === id ? "bg-brand-500 text-white" : "hover:bg-[rgb(var(--bg))] text-[rgb(var(--muted))]"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-[rgb(var(--card))] border border-base rounded-3xl p-6 lg:p-8">
        {tab === "add" && (
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold mb-6">Yangi kino / serial qo&apos;shish</h2>
            <AdminAddContentForm />
          </div>
        )}

        {tab === "stats" && (
          <div>
            <h2 className="text-lg font-bold mb-4">Statistika</h2>
            <p className="text-[rgb(var(--muted))] text-sm">
              Batafsil statistika tez orada qo&apos;shiladi.
            </p>
          </div>
        )}

        {tab === "site" && (
          <div className="max-w-xl">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-brand-500" />
              Sayt sozlamalari
            </h2>
            <form onSubmit={saveSiteSettings} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Sayt nomi</label>
                <input
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="PlayKinoUz"
                  className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-base focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Telegram kanal linki</label>
                <input
                  value={telegramChannel}
                  onChange={(e) => setTelegramChannel(e.target.value)}
                  placeholder="https://t.me/playkinouz"
                  className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-base focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                />
                <p className="text-xs text-[rgb(var(--muted))]">Footer'da ko&apos;rsatiladigan Telegram kanal manzili</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Sayt tavsifi</label>
                <input
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  placeholder="O'zbek tilida eng yaxshi kinolar"
                  className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-base focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={siteStatus === "loading"}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl font-semibold transition-colors text-sm"
              >
                {siteStatus === "loading" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saqlanmoqda...</>
                ) : siteStatus === "ok" ? (
                  <><CheckCircle className="w-4 h-4" /> Saqlandi!</>
                ) : (
                  "Saqlash"
                )}
              </button>
              {siteStatus === "error" && (
                <p className="text-red-500 text-sm">Xatolik. SUPER_ADMIN_TOKEN tekshiring.</p>
              )}
            </form>
          </div>
        )}

        {tab === "settings" && (
          <div className="max-w-xl space-y-6">
            <h2 className="text-lg font-bold">Cloudflare R2 Sozlamalari</h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              R2 ma&apos;lumotlarini Telegram botidagi{" "}
              <span className="text-brand-500 font-medium">☁️ R2 Xotira sozlash</span> tugmasi
              orqali o&apos;zgartiring (super admin paneliga kirgan holda).
            </p>
            <div className="p-4 bg-[rgb(var(--bg))] rounded-2xl border border-base text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[rgb(var(--muted))]">R2 Storage:</span>
                <span className="font-medium">Telegram bot orqali boshqariladi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[rgb(var(--muted))]">IMDb scraper:</span>
                <span className="font-medium">Redis + BullMQ (WSL)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-[rgb(var(--muted))]">Database:</span>
                <span className="font-medium">PostgreSQL — playkinouz</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
