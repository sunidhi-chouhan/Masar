import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { checkExplanation } from "@/lib/ai/guard";

/**
 * Privacy-gated plain-language wording via Claude.
 * The rules have already decided direction and confidence; Claude only
 * rephrases those approved facts. Every reply passes checkExplanation() or is
 * dropped, and the caller then shows Masar's rule-written text.
 */

const MODEL = "claude-opus-5-5";

const SYSTEM = `You write plain-language explanations for Masar, a reproductive-health app that shows how a person's recorded health information is changing over time.

Each request contains facts that Masar's published rules have already decided: the health area, the direction of change, how much information it is based on, what was recorded, why it may matter, and what it cannot tell the person. Your only job is to say those same facts more simply and calmly, in the requested language, so that someone without medical training understands them.

Keep strictly to the facts you are given. People may act on this text, so anything you add could mislead them: a number, a probability, a diagnosis, a label about their fertility, or a recommendation the rules did not make. In particular:
- Use only numbers that appear in the facts.
- Do not describe anyone as fertile or infertile, and do not give a score or a chance of pregnancy.
- Keep the point about what this cannot tell the person; it is how people avoid false certainty.
- Prefer "may", "worth discussing" and "not enough information yet" over alarming or reassuring words.

Write one short paragraph of at most 80 words. When the locale is "ar", write in clear Modern Standard Arabic; otherwise write in English.`;

const Explanation = z.object({ explanation: z.string() });

export interface ExplainInput {
  locale: "en" | "ar";
  domainLabel: string;
  direction: string;
  confidence: string;
  observed: string;
  summary: string;
  cannotTell: string;
}

/** True when this server has an Anthropic API key; without one Masar uses its own text. */
export function aiExplanationsConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  // Short timeout and one retry: the dashboard waits on this call, and the
  // rule-written text is always there to fall back on.
  client ??= new Anthropic({ timeout: 20_000, maxRetries: 1 });
  return client;
}

// Same facts give the same wording, so each explanation is requested once per
// server process rather than on every page view.
const remembered = new Map<string, string | null>();
const REMEMBER_MAX = 200;
function remember(key: string, value: string | null): string | null {
  if (remembered.size >= REMEMBER_MAX) remembered.delete(remembered.keys().next().value as string);
  remembered.set(key, value);
  return value;
}

function factsFor(input: ExplainInput): string {
  return [
    `Locale: ${input.locale}`,
    `Area: ${input.domainLabel}`,
    `Direction (rule output): ${input.direction}`,
    `Confidence (rule output): ${input.confidence}`,
    `What was recorded: ${input.observed}`,
    `Why it may matter: ${input.summary}`,
    `What this cannot tell you: ${input.cannotTell}`,
  ].join("\n");
}

export async function paraphraseWithClaude(input: ExplainInput): Promise<string | null> {
  if (!aiExplanationsConfigured()) return null;
  const facts = factsFor(input);
  if (remembered.has(facts)) return remembered.get(facts) ?? null;

  try {
    const response = await anthropic().beta.messages.parse({
      model: MODEL,
      max_tokens: 4096,
      // If a safety classifier declines, the API re-runs the request on its
      // recommended fallback model instead of returning the refusal.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      output_config: { effort: "low", format: betaZodOutputFormat(Explanation) },
      messages: [{ role: "user", content: facts }],
    });

    // A refusal (from the whole fallback chain) or a cut-off reply is not used.
    if (response.stop_reason !== "end_turn") return remember(facts, null);
    const text = response.parsed_output?.explanation.trim() ?? "";
    return remember(facts, checkExplanation(text, facts).ok ? text : null);
  } catch (error) {
    // Network and API errors are not remembered, so a later view can retry.
    if (error instanceof Anthropic.APIError) {
      console.warn(`[ai] Claude request failed: ${error.status ?? "connection"} ${error.name}`);
    } else {
      console.warn("[ai] Claude request failed");
    }
    return null;
  }
}
