"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Sun, Moon, Search, Clapperboard, Film, Tv, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";
import { locales, localeLabels, type Locale } from "@/lib/i18n";

export function Navbar() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isWatch = pathname.startsWith("/watch/");

  useEffect(() => setMounted(true), []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`);
  }

  if (isWatch) return null;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b border-base bg-[rgb(var(--bg))]/80">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center gap-2 sm:gap-4">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 text-brand-500 font-bold flex-shrink-0">
          <Clapperboard className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="hidden sm:flex flex-col leading-tight">
            <span className="text-base">Kinosayt</span>
            <span className="text-xs text-right tracking-widest">PRO</span>
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6 ml-4 text-sm font-medium">
          <Link href="/movies" className={cn("flex items-center gap-2 hover:text-brand-500 transition-colors", pathname.startsWith("/movies") && "text-brand-500")}>
            <Film className="w-4 h-4" />
            {t("nav.movies") || "Kinolar"}
          </Link>
          <Link href="/serials" className={cn("flex items-center gap-2 hover:text-brand-500 transition-colors", pathname.startsWith("/serials") && "text-brand-500")}>
            <Tv className="w-4 h-4" />
            Seriallar
          </Link>
        </nav>

        <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("nav.search")}
              className="w-full pl-9 pr-3 py-2 rounded-full bg-[rgb(var(--card))] border border-base text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-shadow"
            />
          </div>
        </form>

        {/* Language Switcher */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setLangOpen((o) => !o)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold uppercase border border-base hover:bg-[rgb(var(--card))] transition-colors"
          >
            {locale}
            <ChevronDown className="w-3 h-3" />
          </button>
          {langOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-[rgb(var(--card))] border border-base rounded-xl shadow-lg overflow-hidden min-w-[140px]">
                {locales.map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLocale(l); setLangOpen(false); }}
                    className={cn(
                      "w-full px-4 py-2 text-sm text-left hover:bg-brand-500/10 transition-colors flex items-center justify-between",
                      locale === l && "text-brand-500 font-medium"
                    )}
                  >
                    <span>{localeLabels[l]}</span>
                    <span className="text-xs uppercase text-[rgb(var(--muted))]">{l}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex-shrink-0 p-2 rounded-full hover:bg-[rgb(var(--card))] transition-colors"
          aria-label="Toggle dark mode"
        >
          {mounted ? (
            resolvedTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />
          ) : (
            <span className="w-5 h-5 block" />
          )}
        </button>
      </div>
    </header>
  );
}
