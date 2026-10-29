import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/domain/types";

export { DEFAULT_LOCALE, LOCALES };
export type { Locale };

export const LOCALE_COOKIE = "masar_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "ar" ? "en" : "ar";
}

/** Swap the locale prefix on an app path, keeping the rest. */
export function swapLocaleInPath(pathname: string, next: Locale): string {
  const parts = pathname.split("/");
  if (isLocale(parts[1])) {
    parts[1] = next;
    return parts.join("/") || `/${next}`;
  }
  return `/${next}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
