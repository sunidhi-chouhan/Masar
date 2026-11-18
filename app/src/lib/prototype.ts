// The /prototype's view of one synthetic person, computed with Masar's real
// rules. Pure: used in the browser (the dashboard, the clinician's view) and
// on the server (the Gemini adapter), so both see exactly the same record.
// The only simulation is what the Demo Controls switch: whether clinical
// records and lab results are available, and one clearly labelled simulated
// lab result. Nothing here adds a rule, a threshold or a finding.

import { CONDITION_LABEL, type Reading, type Resident, type SourceId } from "./model";
import { applyAnswers } from "./profile";
import { RULES, signalsFor, visibleRecord } from "./signals";
import { MEASURES, factorsFor, measureViews } from "./trajectory";
import { buildDashboard, type Dashboard } from "./dashboard";
import { coverage } from "./path";
import { labelOf, questionById, toRuleAnswers, visibleQuestions, type JAnswers, type SummaryInput } from "./journey";
import { journeyReadings, journeyView, STAGES, type JourneyEdits, type JourneyView, type StageId } from "./longitudinal";

/** The prototype's permissions: one per kind of information, plus the assistant and the clinician. */
export interface ProtoConsent {
  answers: boolean;
  /** cycle starts and symptoms the person logs in Masar */
  cycles: boolean;
  /** sleep, stress, meals and exposure check-ins */
  lifestyle: boolean;
  clinical: boolean;
  labs: boolean;
  device: boolean;
  healthAge: boolean;
  ai: boolean;
  shareClinician: boolean;
}

export interface ProtoSim {
  clinical: "available" | "missing";
  labs: "available" | "missing";
  /** one simulated new lab result, added by the Demo Controls */
  extraLab: boolean;
}

export const NO_CONSENT: ProtoConsent = { answers: false, cycles: false, lifestyle: false, clinical: false, labs: false, device: false, healthAge: false, ai: false, shareClinician: false };
export const ALL_CONSENT: ProtoConsent = { answers: true, cycles: true, lifestyle: true, clinical: true, labs: true, device: true, healthAge: true, ai: true, shareClinician: true };

export const SIMULATED_LAB_DATE = "2026-11-02";

/** The person's record as the Demo Controls have set it up. */
export function simulatedResident(base: Resident, sim: ProtoSim): Resident {
  let readings: Reading[] = base.readings;
  if (sim.labs === "missing") readings = readings.filter((r) => r.source !== "lab");
  if (sim.extraLab && sim.labs === "available") {
    // A routine, in-range result, so the simulation never manufactures a finding.
    readings = [
      ...readings,
      base.sex === "female"
        ? { code: "hba1c", value: 5.3, unit: "%", at: SIMULATED_LAB_DATE, source: "lab" }
        : { code: "semen_concentration", value: 22, unit: "M/mL", at: SIMULATED_LAB_DATE, source: "lab" },
    ];
  }
  return { ...base, conditions: sim.clinical === "missing" ? [] : base.conditions, readings };
}

export function sourcesOf(c: ProtoConsent): Record<SourceId, boolean> {
  return { self: c.answers, malaffi: c.clinical, lab: c.labs, healthAge: c.healthAge, device: c.device || c.cycles };
}

/** The prototype's longitudinal state: the demo clock and the person's own edits. */
export interface ProtoJourney {
  stage: StageId;
  wearableGap: boolean;
  extraObs: boolean;
  edits: JourneyEdits;
}

export function journeyFor(base: Resident, sim: ProtoSim, consent: ProtoConsent, j: ProtoJourney): JourneyView {
  return journeyView(
    base,
    { cycles: consent.cycles, lifestyle: consent.lifestyle, device: consent.device, labs: consent.labs, clinical: consent.clinical },
    { stage: j.stage, wearableGap: j.wearableGap, extraObs: j.extraObs, extraLab: sim.extraLab, labs: sim.labs, clinical: sim.clinical },
    j.edits,
  );
}

/**
 * The record Masar's existing rules read, on the journey's clock: readings
 * dated after the demo's today don't exist yet, and cycle lengths and recent
 * sleep come from the longitudinal observations (already consent-filtered).
 */
function onTheClock(r: Resident, consent: ProtoConsent, jv: JourneyView): Resident {
  const asOf = STAGES[jv.stage].asOf;
  const readings = [
    ...r.readings.filter((x) => x.at <= asOf && !(x.source === "device" && (x.code === "cycle_length" || x.code === "sleep_hours")) && (x.source !== "device" || consent.device)),
    ...journeyReadings(jv),
  ];
  return { ...r, readings };
}

export interface ProtoView {
  resident: Resident;
  record: ReturnType<typeof visibleRecord>;
  dashboard: Dashboard;
}

/** Everything Masar can say about this person, from what they allowed. */
export function protoView(base: Resident, sim: ProtoSim, consent: ProtoConsent, answers: JAnswers, beliefs: (string | null)[] | null, extra: {
    touchpoint?: Resident["touchpoint"];
    request?: { at: string; status: string; attendedAt?: string; bookedFor?: string } | null;
    journey?: JourneyView;
    /** signed-in accounts: values the person confirmed from uploaded reports, their report requests, and whether Masar may look for signals */
    confirmedValues?: Parameters<typeof buildDashboard>[0]["confirmedValues"];
    reports?: Parameters<typeof buildDashboard>[0]["reports"];
    scanning?: boolean;
  } = {},
): ProtoView {
  const sr = simulatedResident(base, sim);
  const r = extra.journey ? onTheClock({ ...sr, readings: sr.readings.map((x) => (sim.extraLab && x.at === SIMULATED_LAB_DATE && x.source === "lab" ? { ...x, at: STAGES[extra.journey!.stage].asOf } : x)) }, consent, extra.journey) : sr;
  const sources = sourcesOf(consent);
  const hasAnswers = consent.answers && Object.keys(answers).length > 0;
  const applied = hasAnswers ? applyAnswers(r, toRuleAnswers(r.sex, answers)) : { resident: r, reported: null };
  const record = visibleRecord(applied.resident, sources, applied.reported);
  const scanning = extra.scanning ?? true;
  const signals = scanning ? signalsFor(record) : [];
  const measures = measureViews(record);
  const factors = factorsFor(record);
  const dashboard = buildDashboard({
    name: r.name.split(" ")[0],
    record,
    signals,
    measures,
    factors,
    sources,
    confirmedValues: consent.labs ? (extra.confirmedValues ?? []) : [],
    scanning,
    recordConditions: consent.clinical ? r.conditions : [],
    touchpoint: extra.touchpoint ?? r.touchpoint,
    beliefs: consent.answers ? beliefs : null,
    request: extra.request ?? null,
    reports: consent.labs ? (extra.reports ?? []) : [],
  });
  return { resident: r, record, dashboard };
}

const CHANGE_IDS = ["cycleChange", "cycleSince", "periodPain"];

/** What the summary is written from: the same shape and rules as the live journey's. */
export function protoSummaryInput(view: ProtoView, consent: ProtoConsent, answers: JAnswers, finalAnswered: string[], tr: (s: string) => string): SummaryInput {
  const sex = view.resident.sex;
  const a: JAnswers = consent.answers ? answers : {};
  const lines = (chapter: string, exclude: string[] = []) =>
    visibleQuestions(sex, a)
      .filter((q) => q.chapter === chapter && !exclude.includes(q.id))
      .flatMap((q) => {
        const l = labelOf(q, a[q.id]);
        return l ? [`${tr(q.text)} ${l.split(", ").map(tr).join(", ")}`] : [];
      });
  const changes = CHANGE_IDS.flatMap((id) => {
    const q = questionById(id);
    const l = q ? labelOf(q, a[id]) : null;
    return q && l ? [`${tr(q.text)} ${tr(l)}`] : [];
  });
  const measures = measureViews(view.record);
  const signals = signalsFor(view.record);
  const records = [
    ...measures.map((m) => {
      const last = m.readings.at(-1)!;
      return `${tr(MEASURES.find((x) => x.code === m.def.code)?.label ?? m.def.label)}: ${last.value} ${last.unit} (${last.at})`;
    }),
    ...view.record.conditions.map((c) => `${tr(CONDITION_LABEL[c])}`),
  ];
  const missing = coverage({ record: view.record, signals, measures, factors: factorsFor(view.record), sources: sourcesOf(consent), confirmedValues: [], scanning: true })
    .filter((c) => c.status !== "on")
    .map((c) => `${tr(c.label)}: ${c.status === "off" ? tr("Not shared") : tr("Not on record yet")}`);
  return {
    goals: lines("goals"),
    history: lines("history", CHANGE_IDS),
    changes,
    lifestyle: lines("life"),
    help: lines("help"),
    followUps: consent.answers ? finalAnswered : [],
    records,
    findings: signals.map((s) => tr(RULES[s.code].title)),
    missing,
    ruleQuestions: [...new Set(signals.flatMap((s) => RULES[s.code].questions))].slice(0, 4).map(tr),
    wantsQuestions: a.prepareQuestions === "yes",
  };
}

export function ageBand(age: number): string {
  if (age < 25) return "18–24";
  if (age < 30) return "25–29";
  if (age < 35) return "30–34";
  if (age < 40) return "35–39";
  return "40–45";
}
