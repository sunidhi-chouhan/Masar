"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { otherLocale, swapLocaleInPath } from "@/lib/i18n/config";

export function LocaleSwitch() {
  const { locale } = useI18n();
  const pathname = usePathname();
  const next = otherLocale(locale);
  return (
    <Link
      href={swapLocaleInPath(pathname, next)}
      hrefLang={next}
      aria-label={next === "ar" ? "التبديل إلى العربية" : "Switch to English"}
      className="flex items-center rounded-pill border border-dawn-200 bg-dawn-100 text-sm"
    >
      <span className={`px-2.5 py-1 ${locale === "en" ? "rounded-pill bg-ink-900 text-dawn-50" : "text-ink-600"}`}>EN</span>
      <span className={`px-2.5 py-1 ${locale === "ar" ? "rounded-pill bg-ink-900 text-dawn-50" : "text-ink-600"}`}>ع</span>
    </Link>
  );
}
