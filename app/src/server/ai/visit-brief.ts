import "server-only";
import { CONDITION_LABEL, INTENTION_LABEL, type OptionKind } from "@/lib/model";
import { OPTION_LABEL, RULES, clinicalReason } from "@/lib/signals";
import type { PersonView } from "@/server/views";
import { aiAllowedFor, generateJson } from "./gemini";
import { checkOutput } from "./guard";

// A short pre-visit brief for the family physician. Like the resident's
// assistant, it only restates what Masar's rules and the record already say.

export interface VisitBrief {
  summary: string;
  focus: string[];
  gaps: string[];
  from: "ai" | "masar";
}

/** The facts the brief is written from. `v` must come from clinicianView(), so reports are already filtered. */
export function facts(v: PersonView): string {
  const r = v.resident;
  const lines = [
    `${r.age}-year-old ${r.sex === "female" ? "woman" : "man"}. Plans: ${v.record.intention ? INTENTION_LABEL[v.record.intention] : "not shared"}.`,
  ];
  if (v.record.conditions.length) lines.push(`Conditions: ${v.record.conditions.map((c) => CONDITION_LABEL[c]).join(", ")}.`);
  for (const s of v.signals) lines.push(`Flag: ${RULES[s.code].clinicalTitle} (${s.reasons.map(clinicalReason).join("; ")}). Evidence: ${RULES[s.code].evidence.citation}.`);
  for (const m of v.measures) lines.push(`Trend, ${m.def.label}: ${m.sentence} (${m.verdict}).`);
  for (const f of v.factors) lines.push(`Factor: ${f.label} ${f.value}.`);
  if (v.missing.length) lines.push(`Missing: ${v.missing.join("; ")}.`);
  if (v.state.request) {
    lines.push(`Patient asked for: ${OPTION_LABEL[v.state.request.option].title}.`);
    if (v.state.request.questions.length) lines.push(`Patient's questions: ${v.state.request.questions.join(" | ")}`);
  }
  for (const rep of v.state.reports) if (rep.forDoctor) lines.push(`Uploaded ${rep.test}: ${rep.forDoctor}`);
  return lines.join("\n");
}

/** The patient's chosen option, as a clinician would write it. */
const CLINICAL_OPTION: Record<OptionKind, string> = {
  Learn: "information and reading",
  Optimise: "support with modifiable risk factors",
  TestDiscuss: "discussion of further testing",
  Counsel: "preconception counselling",
  PreserveDiscuss: "fertility-preservation discussion",
  Refer: "specialist referral",
};

const SYSTEM = `You prepare a family physician in Abu Dhabi for a reproductive-health conversation. Use only the facts given. Do not add diagnoses, numbers or recommendations beyond them; the physician decides. Be concise and clinical.
Return: "summary" (two sentences), "focus" (three short points to cover in the visit), "gaps" (missing information worth collecting, may be empty).`;

export async function visitBrief(v: PersonView): Promise<VisitBrief> {
  // The patient's summary only goes to the assistant with the patient's own assistant consent.
  if (aiAllowedFor(v.resident.id, "assistant")) {
    const known = facts(v);
    try {
      const out = await generateJson<Omit<VisitBrief, "from">>({
        personId: v.resident.id,
        purpose: "assistant",
        activity: "Read your summary to prepare Dr Layla for your visit",
        system: SYSTEM,
        temperature: 0.2,
        turns: [{ role: "user", parts: [{ text: known }] }],
        schema: {
          type: "OBJECT",
          properties: {
            summary: { type: "STRING" },
            focus: { type: "ARRAY", items: { type: "STRING" } },
            gaps: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["summary", "focus", "gaps"],
        },
      });
      const brief: VisitBrief = {
        summary: out.summary.trim().slice(0, 600),
        focus: out.focus.slice(0, 5).map((x) => x.slice(0, 200)),
        gaps: out.gaps.slice(0, 6).map((x) => x.slice(0, 200)),
        from: "ai",
      };
      const problem = brief.summary ? checkOutput([brief.summary, ...brief.focus, ...brief.gaps], [known]) : "empty summary";
      if (!problem) return brief;
      console.warn("[visit-brief] brief withheld:", problem);
    } catch (e) {
      console.error("[visit-brief]", e instanceof Error ? e.message : e);
    }
  }
  const r = v.resident;
  const flags = v.signals.map((s) => RULES[s.code].clinicalTitle);
  return {
    summary: `${r.age}-year-old ${r.sex === "female" ? "woman" : "man"}; reproductive plans: ${
      v.record.intention ? INTENTION_LABEL[v.record.intention].toLowerCase() : "not shared"
    }. ${flags.length ? `Flags: ${flags.join("; ")}.` : "No current flags."}`,
    focus: [
      ...v.signals.flatMap((s) => s.reasons.map(clinicalReason)).slice(0, 2),
      v.state.request ? `Patient requested: ${CLINICAL_OPTION[v.state.request.option]}` : "Explore plans and preferred timing",
    ],
    gaps: v.missing,
    from: "masar",
  };
}
