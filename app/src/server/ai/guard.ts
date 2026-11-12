import "server-only";
import type { Schema } from "./gemini";

// Deterministic checks on everything Gemini returns, before anyone sees it.
// Any failure means the caller shows Masar's own text instead (fail closed).
//
// 1. Shape: the response must match the schema it was asked for.
// 2. Content: no fertility scores, pregnancy chances, diagnoses, false
//    reassurance, links or contact details.
// 3. Numbers: every number in the output must already be in what Masar sent.

/** Problems with a value against a schema; empty when it matches. */
export function schemaProblems(schema: Schema, value: unknown, at = "$"): string[] {
  if (value === null || value === undefined) return schema.nullable ? [] : [`${at}: missing`];
  switch (schema.type) {
    case "STRING":
      if (typeof value !== "string") return [`${at}: not a string`];
      if (schema.enum && !schema.enum.includes(value)) return [`${at}: not one of the allowed values`];
      return [];
    case "NUMBER":
      return typeof value === "number" && Number.isFinite(value) ? [] : [`${at}: not a number`];
    case "BOOLEAN":
      return typeof value === "boolean" ? [] : [`${at}: not a boolean`];
    case "ARRAY":
      if (!Array.isArray(value)) return [`${at}: not a list`];
      return schema.items ? value.flatMap((x, i) => schemaProblems(schema.items!, x, `${at}[${i}]`)) : [];
    case "OBJECT": {
      if (typeof value !== "object" || Array.isArray(value)) return [`${at}: not an object`];
      const obj = value as Record<string, unknown>;
      const out: string[] = [];
      for (const k of schema.required ?? []) if (obj[k] === undefined) out.push(`${at}.${k}: missing`);
      for (const [k, sub] of Object.entries(schema.properties ?? {})) if (obj[k] !== undefined) out.push(...schemaProblems(sub, obj[k], `${at}.${k}`));
      return out;
    }
  }
}

// ---------- content ----------

const NEGATION = /\b(not|never|no|isn't|is not|aren't|doesn't|don't|cannot|can't|won't|neither|nor)\b|لا |ليس|ليست|لن |لم |ولا /i;

/** Always refused, whatever the sentence around them says. */
const ALWAYS: [RegExp, string][] = [
  [/\b(fertility|reproductive|fertile|risk)\s*(score|rating|index|grade|age)\b/i, "fertility score"],
  [/\b(score|rate|rank)\s+(your|my|the)\s+fertility\b/i, "fertility score"],
  [/\b\d+(\.\d+)?\s*(%|percent|per cent)\s*(chance|probability|likelihood|odds|risk)\b/i, "pregnancy probability"],
  [/\b(chance|chances|probability|likelihood|odds|risk)\b[^.!?\n]{0,40}\b\d+(\.\d+)?\s*(%|percent|per cent|in\s+\d+|out of\s+\d+)/i, "pregnancy probability"],
  [/\b\d+\s*(in|out of)\s*\d+\s+(women|men|couples|people|chance)\b/i, "pregnancy probability"],
  [/\b(chances?|odds|likelihood|probability)\s+(of\s+\w+\s+)?(are|is|look|looks|seem|seems)\s+(very\s+)?(good|high|low|excellent|great|slim|poor|fine)\b/i, "pregnancy prediction"],
  // "you will / won't / can / can't conceive", but not "can't say whether you will conceive"
  [
    /(?<!\b(whether|if|tell|say|predict|know)\s+)\byou\s+(will|won't|will not|can|can't|cannot|can not|are unable to|are able to|should be able to)\s+(still\s+)?(be able to\s+)?(conceive|get pregnant|have (a |any )?(baby|babies|children|child)|father a child)\b/i,
    "pregnancy prediction",
  ],
  [/\byou\s+are\s+(in)?fertile\b|\binfertile\b|\bsterile\b/i, "fertility label"],
  [/\b(this|that|it)\s+(means|shows|confirms|proves)\s+(that\s+)?you\s+have\b/i, "diagnostic claim"],
  [/\byou\s+(probably|likely|most likely|definitely|certainly|clearly)\s+have\b/i, "diagnostic claim"],
  [/\b(sounds|looks)\s+like\s+you\s+have\b|\bi\s+(think|believe)\s+you\s+have\b|\bconsistent with a diagnosis\b|\byou('ve| have) been diagnosed\b/i, "diagnostic claim"],
  [/\b(take|start|stop|increase|decrease)\s+[\w-]+\s+\d+\s*(mg|mcg|µg|iu|units)\b/i, "treatment advice"],
  // reassurance phrases that carry their own negation word, so can't use the negation exception
  [/\bno need to (worry|see a doctor|be concerned|get (it )?checked)\b|\bno cause for concern\b|\bnothing to be concerned about\b/i, "false reassurance"],
  [/لا داعي للقلق|لا داعي للخوف|لا يوجد ما يدعو للقلق|لا حاجة لزيارة الطبيب/, "false reassurance"],
  [/https?:\/\/|www\.|\b[\w.+-]+@[\w-]+\.[\w.]+\b/i, "link or contact detail"],
  // Arabic
  [/(درجة|مؤشر|تقييم|نقاط)\s*(ال)?خصوبة/, "fertility score"],
  [/عقيم|عقم لديك|أنتم?\s*عقيم/, "fertility label"],
  [/(نسبة|احتمال|فرصة|فرص)[^.!؟\n]{0,30}\d+\s*(%|٪|بالمئة|في المئة|من\s*\d+)/, "pregnancy probability"],
  [/\d+\s*(%|٪)\s*(احتمال|فرصة)/, "pregnancy probability"],
  [/(هذا|ذلك)\s+(يعني|يؤكد|يثبت)\s+(أن(ك|كم)|أنّ(ك|كم))\s+(مصاب|تعاني|لدي)/, "diagnostic claim"],
  [/(على الأرجح|غالبًا|بالتأكيد)\s+(أنكم?|أنّكم?)?\s*(مصاب|تعانون|تعاني|لديك)/, "diagnostic claim"],
];

/** Refused unless the same sentence negates it ("this is not an all-clear"). */
const UNLESS_NEGATED: [RegExp, string][] = [
  [/\ball[\s-]clear\b/i, "false reassurance"],
  [/\bnothing to worry about\b/i, "false reassurance"],
  [/\byou('re| are)\s+(perfectly\s+|completely\s+|totally\s+)?(fine|healthy|normal|okay|ok)\b/i, "false reassurance"],
  [/\b(everything|all)\s+(is|looks|seems)\s+(fine|normal|good|ok|okay|healthy)\b/i, "false reassurance"],
  [/\byour\s+fertility\s+(is|looks|seems)\s+(fine|normal|good|healthy|great|excellent)\b/i, "false reassurance"],
  [/كل شيء طبيعي|كل شيء على ما يرام|أنتم? بخير|خصوبت(ك|كم) (طبيعية|جيدة|سليمة)/, "false reassurance"],
];

const sentences = (text: string) => text.split(/(?<=[.!?؟\n])\s+/);

/** Why a piece of text may not be shown, or null when it may. */
export function prohibited(text: string): string | null {
  for (const [re, why] of ALWAYS) if (re.test(text)) return why;
  for (const s of sentences(text)) {
    for (const [re, why] of UNLESS_NEGATED) if (re.test(s) && !NEGATION.test(s)) return why;
  }
  return null;
}

// ---------- numbers ----------

const DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

/**
 * Every number written in a text, as a canonical string ("1.30" and "1.3" are
 * the same number). A percentage keeps its sign ("25%"), so a number that is
 * in the record as something else (12 months) can't come back as a
 * percentage (12%).
 */
export function numbersIn(text: string): string[] {
  const western = text.replace(/[٠-٩۰-۹]/g, (d) => DIGITS[d]).replace(/٫/g, ".").replace(/٪/g, "%");
  const re = /(\d+(?:,\d{3})+(?:\.\d+)?|\d+(?:[.,]\d+)?)(\s*(?:%|percent\b|per cent\b|بالمئة|في المئة))?/gi;
  return [...western.matchAll(re)].map(([, raw, pct]) => {
    const n = /,\d{3}(\D|$)/.test(raw) ? raw.replace(/,/g, "") : raw.replace(",", ".");
    return String(Number(n)) + (pct ? "%" : "");
  });
}

/** Numbers in `output` that appear nowhere in the authorised inputs. */
export function unauthorisedNumbers(output: string, authorised: string[]): string[] {
  const allowed = new Set(authorised.flatMap(numbersIn));
  return [...new Set(numbersIn(output))].filter((x) => !allowed.has(x));
}

/** The emergency number the assistant is told to give; always allowed. */
export const ALWAYS_ALLOWED_NUMBERS = "999";

/**
 * One verdict for a set of generated texts: null when all may be shown,
 * otherwise the first reason they may not.
 */
export function checkOutput(texts: string[], authorised: string[]): string | null {
  for (const t of texts) {
    const why = prohibited(t);
    if (why) return why;
  }
  const extra = unauthorisedNumbers(texts.join("\n"), [...authorised, ALWAYS_ALLOWED_NUMBERS]);
  return extra.length ? `numbers not in the record: ${extra.join(", ")}` : null;
}

// ---------- the person's message ----------

const URGENT: RegExp[] = [
  /\b(severe|really bad|unbearable|terrible|extreme)\s+(pain|cramps?)\b/i,
  /\b(heavy|heavily|a lot of|lots of)\s+bleed(ing)?\b|\bbleeding\s+(heavily|a lot)\b|\bsoaking\b/i,
  /\bpregnan\w*\b[^.!?]{0,40}\b(bleed\w*|pain|cramp\w*)\b|\b(bleed\w*|pain|cramp\w*)\b[^.!?]{0,40}\bpregnan\w*\b/i,
  /\bmiscarr\w*|\bectopic\b/i,
  /\b(suicid\w*|kill (myself|me)|end (my|it all)|self[-\s]?harm|hurt(ing)? myself|don't want to (live|be here))\b/i,
  /ألم شديد|ألم لا يحتمل|نزيف (حاد|شديد|غزير)|إجهاض|حمل خارج الرحم|انتحار|أؤذي نفسي|إيذاء النفس|أنهي حياتي/,
];

/** Messages that need a person, not an assistant: answered with fixed text and never sent to the model. */
export function needsUrgentCare(message: string): boolean {
  return URGENT.some((re) => re.test(message));
}
