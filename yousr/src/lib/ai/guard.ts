// Checks run on every AI-written explanation before anyone sees it. Pure
// functions, so they are tested without calling a model. Any failure means the
// person sees Masar's rule-written text instead.

/** Labels and predictions Masar never shows, in English and Arabic. */
const BANNED =
  /fertility score|pregnancy probability|chance of pregnancy|risk score|\binfertile\b|\bfertile\b|درجة\s*(ال)?خصوبة|احتمال\s*(ال)?حمل|عقيمة?/gi;

/**
 * A banned phrase is allowed only when the approved facts already use it,
 * which happens in "what this cannot tell you" lines (for example the Arabic
 * cycle copy says it cannot confirm "احتمال الحمل").
 */
function hasNewBannedPhrase(text: string, facts: string): boolean {
  const approved = facts.toLowerCase();
  for (const match of text.matchAll(BANNED)) {
    if (!approved.includes(match[0].toLowerCase())) return true;
  }
  return false;
}

const MAX_CHARS = 900;

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";

/** Every number in a text, normalised so "2.4", "٢٫٤" and "2,4" compare equal. */
export function numbersIn(text: string): Set<string> {
  const western = text
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/(\d)[٫,](\d)/g, "$1.$2");
  const found = western.match(/\d+(?:\.\d+)?/g) ?? [];
  return new Set(found.map((n) => String(Number(n))));
}

export type GuardResult = { ok: true } | { ok: false; reason: "empty" | "too_long" | "banned_wording" | "new_number" };

/**
 * An explanation passes only if it is non-empty, short, free of banned labels,
 * and uses no number that is not already in the facts it was given.
 */
export function checkExplanation(text: string, facts: string): GuardResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: "empty" };
  if (trimmed.length > MAX_CHARS) return { ok: false, reason: "too_long" };
  if (hasNewBannedPhrase(trimmed, facts)) return { ok: false, reason: "banned_wording" };
  const allowed = numbersIn(facts);
  for (const n of numbersIn(trimmed)) {
    if (!allowed.has(n)) return { ok: false, reason: "new_number" };
  }
  return { ok: true };
}
