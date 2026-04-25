"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/providers/i18n-provider";
import { Clapperboard } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  const { t } = useI18n();

  if (pathname.startsWith("/watch/")) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-base bg-[rgb(var(--card))]">
      {/* Footer content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 text-brand-500 font-bold">
            <Clapperboard className="w-6 h-6" />
            <span className="flex flex-col leading-tight">
              <span className="text-sm">Kinosayt</span>
              <span className="text-xs text-right tracking-widest">PRO</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/terms"
              className="text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"
            >
              {t("footer.terms")}
            </Link>
            <Link
              href="/privacy"
              className="text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"
            >
              {t("footer.privacy")}
            </Link>
          </div>
        </div>

        {/* Disclaimer — subtle muted text above copyright */}
        <p className="mt-6 text-xs text-center text-[rgb(var(--muted))]/60 leading-relaxed max-w-2xl mx-auto">
          Saytdagi barcha ma&apos;lumotlar faqat o&apos;rganish maqsadida. Mualliflik huquqi bilan
          bog&apos;liq murojaat qilinganda har qanday film olib tashlanishi mumkin.
        </p>

        {/* Copyright */}
        <div className="mt-3 pt-4 border-t border-base text-center">
          <p className="text-xs text-[rgb(var(--muted))]">
            © {year} Tarjima Kinolar 616. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
