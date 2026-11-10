import { AR, AR_PATTERNS } from "./i18n-ar";

// Resident-facing text is written in English and looked up in Arabic by its
// English wording. Anything without a translation stays in English rather
// than showing a blank. Doctor and health-system screens are English only.

export type Lang = "en" | "ar";
export const LANG_COOKIE = "masar_lang";
export type Vars = Record<string, string | number>;

function arabic(text: string): string {
  const exact = AR[text];
  if (exact !== undefined) return exact;
  for (const [pattern, to] of AR_PATTERNS) {
    const m = text.match(pattern);
    if (m) return typeof to === "string" ? text.replace(pattern, to) : to(m, arabic);
  }
  return text;
}

export function t(lang: Lang, text: string, vars?: Vars): string {
  let out = lang === "ar" ? arabic(text) : text;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

export const dirOf = (lang: Lang) => (lang === "ar" ? "rtl" : "ltr");

/** Dates in the person's language, with Western digits in both. */
export function formatDateIn(lang: Lang, iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-AE-u-nu-latn" : "en-GB", opts);
}
