"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/providers/i18n-provider";
import { Clapperboard } from "lucide-react";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface SiteConfig {
  SITE_NAME: string;
  TELEGRAM_CHANNEL: string;
  SITE_DESCRIPTION: string;
}

const DEFAULT_CONFIG: SiteConfig = {
  SITE_NAME: "PlayKinoUz",
  TELEGRAM_CHANNEL: "https://t.me/playkinouz",
  SITE_DESCRIPTION: "O'zbek tilida eng yaxshi kinolar",
};

export function Footer() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    fetch(`${API}/settings/public`)
      .then((r) => r.json())
      .then((data) => setConfig({ ...DEFAULT_CONFIG, ...data }))
      .catch(() => {});
  }, []);

  if (pathname.startsWith("/watch/")) return null;

  const year = new Date().getFullYear();

  // Extract handle from full URL for display
  const tgHandle = config.TELEGRAM_CHANNEL.replace("https://t.me/", "@");

  return (
    <footer className="border-t border-base bg-[rgb(var(--card))]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 text-brand-500 font-bold">
            <Clapperboard className="w-6 h-6" />
            <span className="flex flex-col leading-tight">
              <span className="text-sm tracking-tight">PlayKino</span>
              <span className="text-xs text-right tracking-widest font-black">UZ</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link href="/terms" className="text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
              {t("footer.terms")}
            </Link>
            <Link href="/privacy" className="text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
              {t("footer.privacy")}
            </Link>
          </div>
        </div>

        {/* Telegram channel promo */}
        <div className="mt-6 flex justify-center">
          <a
            href={config.TELEGRAM_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[rgb(var(--bg))] border border-base hover:border-brand-500/40 hover:bg-brand-500/5 transition-all duration-200 group"
          >
            <svg className="w-5 h-5 text-[#2AABEE] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
            </svg>
            <span className="text-sm text-[rgb(var(--muted))] group-hover:text-[rgb(var(--fg))] transition-colors">
              Telegram kanalimizga obuna bo&apos;ling
            </span>
            <span className="text-xs font-medium text-[#2AABEE] opacity-80">{tgHandle}</span>
          </a>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-xs text-center text-[rgb(var(--muted))]/60 leading-relaxed max-w-2xl mx-auto">
          Saytdagi barcha ma&apos;lumotlar faqat o&apos;rganish maqsadida. Mualliflik huquqi bilan
          bog&apos;liq murojaat qilinganda har qanday film olib tashlanishi mumkin.
        </p>

        {/* Copyright */}
        <div className="mt-3 pt-4 border-t border-base text-center">
          <p className="text-xs text-[rgb(var(--muted))]">
            © {year} {config.SITE_NAME}. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
