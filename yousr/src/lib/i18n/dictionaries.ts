import "server-only";
import type { Locale } from "./config";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import { createTranslator, type Dictionary, type Translator } from "./translate";

const dictionaries: Record<Locale, Dictionary> = {
  en: en as unknown as Dictionary,
  ar: ar as unknown as Dictionary,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}

export function getTranslator(locale: Locale): Translator {
  return createTranslator(getDictionary(locale), dictionaries.en);
}
