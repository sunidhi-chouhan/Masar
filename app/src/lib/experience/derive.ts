import type { SourceId } from "@/lib/model";
import { HEROES } from "@/lib/population";
import { labelFor, questionsFor, applyAnswers, type Answers } from "@/lib/profile";
import {
  RULES,
  optionsFor,
  series,
  signalsFor,
  topUrgency,
  visibleRecord,
  type Signal,
  type VisibleRecord,
} from "@/lib/signals";
import { factorsFor, measureViews, missingFor, type Factor, type MeasureView } from "@/lib/trajectory";
import type { OptionKind, Resident } from "@/lib/model";

// Noura's authorised view for the simulator. Same rules as the live product.
// Scanning gates conversation signals. Sources gate facts. Nothing here is stored.

export const NOURA: Resident = HEROES.find((h) => h.id === "noura")!;

export type Heading = "know" | "said" | "changed" | "matters" | "certain" | "cannot";
export type Stamp = "fact" | "said" | "trend" | "steady" | "evidence" | "unknown";

export interface Stanza {
  heading: Heading;
  kind: Stamp;
  text: string;
  source?: SourceId;
  at?: string;
}

export interface Observation {
  id: string;
  title: string;
  driver: "modifiable" | "non-modifiable" | "unknown";
  stanzas: Stanza[];
  evidence: { citation: string; strength: "Strong" | "Moderate" } | null;
}

export interface Derived {
  resident: Resident;
  record: VisibleRecord;
  answers: Answers;
  sources: Record<SourceId, boolean>;
  scanning: boolean;
  signals: Signal[];
  measures: MeasureView[];
  factors: Factor[];
  missing: string[];
  options: OptionKind[];
  urgency: ReturnType<typeof topUrgency>;
  observations: Observation[];
}

export interface DeriveInput {
  sources: Record<SourceId, boolean>;
  scanning: boolean;
  answers: Answers;
}

const OFF: Record<string, string> = {
  lab: "Lab results are off, so laboratory values are not in this authorised view.",
  device: "Phone and wearable is off, so cycle dates and sleep from that source are not in this view.",
  healthAge: "The Health Age check is off, so weight from that check is not in this view.",
  self: "What you tell us is off, so family history and plans from that source are not in this view.",
  malaffi: "Clinic records are off, so diagnoses from that source are not in this view.",
};

export function derive(input: DeriveInput): Derived {
  const applied = input.sources.self ? applyAnswers(NOURA, input.answers) : { resident: NOURA, reported: null };
  const record = visibleRecord(applied.resident, input.sources, input.sources.self ? applied.reported : null);
  const signals = input.scanning ? signalsFor(record) : [];
  const measures = measureViews(record);
  return {
    resident: NOURA,
    record,
    answers: input.sources.self ? input.answers : {},
    sources: input.sources,
    scanning: input.scanning,
    signals,
    measures,
    factors: factorsFor(record),
    missing: missingFor(record),
    options: optionsFor(signals),
    urgency: topUrgency(signals),
    observations: observations(input, signals, measures),
  };
}

function off(source: SourceId, title: string, id: string): Observation {
  return {
    id,
    title,
    driver: "unknown",
    evidence: null,
    stanzas: [{ heading: "know", kind: "unknown", text: OFF[source] }],
  };
}

function saidLine(input: DeriveInput, id: string): Stanza {
  if (!input.sources.self) return { heading: "said", kind: "unknown", text: "What you tell us is off, so your answers are not in this view." };
  const value = input.answers[id];
  if (value === undefined) return { heading: "said", kind: "unknown", text: "Nothing you told Masar is part of this comparison." };
  const q = questionsFor("female").find((item) => item.id === id);
  const text = Array.isArray(value)
    ? value.length && q
      ? value.map((v) => labelFor(q, v)).join(", ")
      : "None of the listed conditions."
    : q
      ? labelFor(q, value)
      : String(value);
  return { heading: "said", kind: value === undefined ? "unknown" : "said", text };
}

function changeStanza(measure: MeasureView | undefined): Stanza {
  if (!measure) return { heading: "changed", kind: "unknown", text: "Not enough information to say whether this has changed. One reading is never a trend." };
  if (measure.verdict === "meaningful") return { heading: "changed", kind: "trend", text: measure.sentence };
  if (measure.verdict === "normal") return { heading: "changed", kind: "steady", text: measure.sentence };
  if (measure.verdict === "too_close") return { heading: "changed", kind: "unknown", text: "The two results are too close in time for Masar's published comparison." };
  return { heading: "changed", kind: "unknown", text: measure.sentence };
}

function certain(kind: Stamp): Stanza {
  if (kind === "trend") return { heading: "certain", kind: "fact", text: "This comparison meets Masar's published rule. It is not a prediction about you." };
  if (kind === "steady") return { heading: "certain", kind: "steady", text: "This comparison stays inside Masar's published rule for usual variation. It is not a verdict about you." };
  return { heading: "certain", kind: "unknown", text: "Not enough information to say whether this has changed. One reading is never a trend." };
}

function observations(input: DeriveInput, signals: Signal[], measures: MeasureView[]): Observation[] {
  const measure = (code: MeasureView["def"]["code"]) => measures.find((m) => m.def.code === code);
  const signal = (code: Signal["code"]) => signals.find((s) => s.code === code);
  const out: Observation[] = [];

  if (!input.sources.lab) out.push(off("lab", "Egg-reserve hormone (AMH)", "amh"));
  else {
    const amh = measure("amh");
    const fired = signal("AMH_FALL") ?? signal("AMH_LOW");
    const changed = changeStanza(amh);
    const rule = fired ? RULES[fired.code] : null;
    out.push({
      id: "amh",
      title: "Egg-reserve hormone (AMH)",
      driver: "non-modifiable",
      evidence: rule ? rule.evidence : null,
      stanzas: [
        {
          heading: "know",
          kind: "fact",
          text: fired ? fired.reasons[0] : amh?.sentence ?? "Not enough information to say whether this has changed. One reading is never a trend.",
          source: "lab",
          at: series(input.sources.lab ? NOURA.readings : [], "amh").at(-1)?.at,
        },
        saidLine(input, "plans"),
        changed,
        rule
          ? { heading: "matters", kind: "evidence", text: rule.whyItMatters }
          : { heading: "matters", kind: "fact", text: amh?.def.rule ?? "No guideline citation is attached to this comparison in Masar's published rules." },
        certain(changed.kind),
        { heading: "cannot", kind: "unknown", text: rule?.cannotTell ?? "No guideline citation is attached to this comparison in Masar's published rules." },
      ],
    });
  }

  if (!input.sources.self) out.push(off("self", "Family history", "family"));
  else {
    const fired = signal("FAMILY_EARLY_MENOPAUSE");
    const rule = fired ? RULES[fired.code] : null;
    const saidNo = input.answers.familyMenopause === "no";
    const onRecord = !saidNo && (input.answers.familyMenopause === "yes" || input.answers.familyMenopause === undefined);
    const knows = onRecord && (fired ? fired.reasons : ["Your mother or sister went through menopause before 45"]);
    out.push({
      id: "family",
      title: "Early menopause in your family",
      driver: "non-modifiable",
      evidence: rule ? rule.evidence : null,
      stanzas: [
        ...(knows
          ? knows.map((text) => ({ heading: "know" as const, kind: "said" as const, text, source: "self" as const }))
          : [{ heading: "know" as const, kind: "unknown" as const, text: "Nothing you told Masar is part of this comparison." }]),
        saidLine(input, "familyMenopause"),
        { heading: "changed", kind: "unknown", text: "Family history is not a series of measurements, so Masar does not call it a trend." },
        rule
          ? { heading: "matters", kind: "evidence", text: rule.whyItMatters }
          : { heading: "matters", kind: "unknown", text: "No guideline citation is attached to this comparison in Masar's published rules." },
        { heading: "certain", kind: "unknown", text: "This is a self-report, not a laboratory measurement." },
        {
          heading: "cannot",
          kind: "unknown",
          text: rule?.cannotTell ?? "Family history alone cannot tell when your own menopause will happen or whether you will conceive.",
        },
      ],
    });
  }

  if (!input.sources.device) out.push(off("device", "Cycle length", "cycles"));
  else {
    const cycles = measure("cycle_length");
    const changed = changeStanza(cycles);
    const fired = signal("CYCLE_IRREGULAR");
    const rule = fired ? RULES.CYCLE_IRREGULAR : null;
    out.push({
      id: "cycles",
      title: "Cycle length",
      driver: "non-modifiable",
      evidence: rule ? rule.evidence : null,
      stanzas: [
        { heading: "know", kind: "fact", text: cycles?.sentence ?? "Not enough information to say whether this has changed. One reading is never a trend.", source: "device" },
        saidLine(input, "cycles"),
        changed,
        rule
          ? { heading: "matters", kind: "evidence", text: rule.whyItMatters }
          : { heading: "matters", kind: "fact", text: cycles?.def.rule ?? "No guideline citation is attached to this comparison in Masar's published rules." },
        certain(changed.kind === "trend" ? "trend" : changed.kind === "steady" ? "steady" : "unknown"),
        { heading: "cannot", kind: "unknown", text: RULES.CYCLE_IRREGULAR.cannotTell },
      ],
    });
  }

  if (!input.sources.healthAge) out.push(off("healthAge", "Weight for height (BMI)", "bmi"));
  else {
    const bmi = measure("bmi");
    const changed = changeStanza(bmi);
    out.push({
      id: "bmi",
      title: "Weight for height (BMI)",
      driver: "modifiable",
      evidence: null,
      stanzas: [
        { heading: "know", kind: "fact", text: bmi?.sentence ?? "Not enough information to say whether this has changed. One reading is never a trend.", source: "healthAge" },
        { heading: "said", kind: "unknown", text: "Nothing you told Masar is part of this comparison." },
        changed,
        { heading: "matters", kind: "fact", text: bmi?.def.rule ?? "No guideline citation is attached to this comparison in Masar's published rules." },
        certain(changed.kind),
        { heading: "cannot", kind: "unknown", text: "No guideline citation is attached to this comparison in Masar's published rules." },
      ],
    });
  }

  if (!input.sources.device) {
    /* sleep shares the device source; the cycles row already says the source is off */
  } else {
    const sleep = measure("sleep_hours");
    const changed = changeStanza(sleep);
    out.push({
      id: "sleep",
      title: "Sleep",
      driver: "modifiable",
      evidence: null,
      stanzas: [
        { heading: "know", kind: sleep && sleep.readings.length > 1 ? "fact" : "unknown", text: sleep?.sentence ?? "Not enough information to say whether this has changed. One reading is never a trend.", source: "device" },
        saidLine(input, "sleep"),
        changed,
        { heading: "matters", kind: "fact", text: sleep?.def.rule ?? "No guideline citation is attached to this comparison in Masar's published rules." },
        certain(changed.kind),
        { heading: "cannot", kind: "unknown", text: "Not enough information to say whether this has changed. One reading is never a trend." },
      ],
    });
  }

  if (!input.sources.malaffi) out.push(off("malaffi", "Clinic records (Malaffi)", "clinic"));
  else {
    out.push({
      id: "clinic",
      title: "Clinic records (Malaffi)",
      driver: "unknown",
      evidence: null,
      stanzas: [
        { heading: "know", kind: "unknown", text: "No condition is recorded in the shared clinic record. That is not a finding that none exists.", source: "malaffi" },
        saidLine(input, "conditions"),
        { heading: "changed", kind: "unknown", text: "Not enough information to say whether this has changed. One reading is never a trend." },
        { heading: "matters", kind: "unknown", text: "No guideline citation is attached to this comparison in Masar's published rules." },
        { heading: "certain", kind: "unknown", text: "Missing information is not a negative finding." },
        { heading: "cannot", kind: "unknown", text: "Missing information is not a negative finding." },
      ],
    });
  }

  return out;
}

export function citationFor(code: Signal["code"] | undefined): { citation: string; strength: "Strong" | "Moderate" } | null {
  if (!code) return null;
  return RULES[code].evidence;
}

export function clinicianLines(view: Derived): string[] {
  const lines = ["I can see only what was shared with the clinician."];
  if (!view.signals.length) {
    lines.push("Nothing in the shared information meets a published reason for a conversation.", "We can still talk. I will not invent a finding.");
  } else {
    for (const s of view.signals) {
      lines.push(RULES[s.code].whyItMatters, RULES[s.code].cannotTell);
    }
  }
  lines.push("What a published guideline says, about people in general, not a prediction about you.");
  lines.push("I decide with you. Masar does not prescribe. This screen is not an appointment and not a call.");
  return lines;
}
