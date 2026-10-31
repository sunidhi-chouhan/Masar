import "server-only";
import { rejectsClinicalInvention } from "@/lib/ai/reject";

/**
 * Privacy-gated plain-language paraphrase via Gemini.
 * Rules still compute direction; this never invents numbers or diagnoses.
 */

const SYSTEM = `You help people understand reproductive-health decision support copy.
You receive structured facts already computed by deterministic rules.
Rewrite them in clear, calm, non-directive plain language (English or Arabic as requested).
Rules you must follow:
- Do not invent measurements, scores, probabilities, diagnoses, or fertility labels.
- Do not say fertile, infertile, risk score, declining, poor, or optimal.
- Prefer "may", "can", "worth discussing", "not enough information".
- Keep under 80 words.
- If input is incomplete, say what cannot be concluded.
Return only the rewritten paragraph, no title.`;

export interface GeminiExplainInput {
  locale: "en" | "ar";
  domainLabel: string;
  direction: string;
  confidence: string;
  observed: string;
  summary: string;
  cannotTell: string;
}

export async function paraphraseWithGemini(input: GeminiExplainInput): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;

  const user = [
    `Locale: ${input.locale}`,
    `Area: ${input.domainLabel}`,
    `Direction (rule output): ${input.direction}`,
    `Confidence (rule output): ${input.confidence}`,
    `What was recorded: ${input.observed}`,
    `Why it may matter: ${input.summary}`,
    `What this cannot tell you: ${input.cannotTell}`,
  ].join("\n");

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${SYSTEM}\n\n${user}` }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 220 },
      }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    if (!text) return null;
    if (rejectsClinicalInvention(text)) return null;
    return text;
  } catch {
    return null;
  }
}
