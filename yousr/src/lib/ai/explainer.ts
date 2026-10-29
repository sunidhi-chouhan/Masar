import type { DomainResult } from "@/lib/domain/types";
import type { Translator } from "@/lib/i18n/translate";

export interface Explanation {
  observed: string;
  why: string;
}

/**
 * Explainer boundary. In this prototype the "AI" is a deterministic template
 * over approved copy; the only thing a model could ever do here is rephrase
 * text that already passed clinical review. It never computes, never adds a
 * fact, never answers free-text questions.
 */
export function explain(result: DomainResult, t: Translator): Explanation {
  const observed = t(`observed.${result.observedKey}`);
  const why = t(`summaries.${result.summaryKey}`);
  return { observed, why };
}

/**
 * Where a hosted model would be called. Disabled by default; returns the
 * approved text unchanged. Guardrails if ever enabled: input is the approved
 * text only, output is checked to contain no digits or new medical nouns, and
 * any failure falls back to the approved text.
 */
export async function rephraseWithModel(approved: Explanation): Promise<Explanation> {
  return approved;
}
