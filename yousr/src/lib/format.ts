import type { Locale } from "@/lib/domain/types";

const intlLocale: Record<Locale, string> = {
  en: "en-GB",
  // Latin digits keep lab values unambiguous for clinicians reading either language.
  ar: "ar-AE-u-nu-latn",
};

export function formatDate(d: Date | string | null | undefined, locale: Locale, opts?: Intl.DateTimeFormatOptions): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(intlLocale[locale], opts ?? { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatMonth(d: Date | string, locale: Locale): string {
  return formatDate(d, locale, { month: "short", year: "2-digit" });
}

export function formatNumber(n: number, locale: Locale, digits = 0): string {
  return new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: digits }).format(n);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}
