"use client";

import { useI18n } from "@/components/providers/i18n-provider";

export default function PrivacyPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-screen-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("privacy.title")}</h1>
      <div className="prose dark:prose-invert max-w-none space-y-4">
        {t("privacy.content")
          .split("\n")
          .map((line, i) => (
            <p key={i} className="text-[rgb(var(--muted))] leading-relaxed">
              {line}
            </p>
          ))}
      </div>
    </div>
  );
}
