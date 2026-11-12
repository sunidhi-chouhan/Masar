// The resident's path: every statement has one certainty label, nothing is
// interpreted without a rule, TSH only against the lab's printed range, and
// every resident-facing sentence has Arabic.
// Run: npm run check  (or: npm run check:path)
import { MEASURE_BASIS, TRIGGER } from "../src/lib/decides";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { HEROES } from "../src/lib/population";
import { ALL_SOURCES, signalsFor, topUrgency, visibleRecord } from "../src/lib/signals";
import { factorsFor, measureViews } from "../src/lib/trajectory";
import { applyAnswers, answersFromRecords } from "../src/lib/profile";
import { buildChapters, coverage, headline, type PathInput, type ReportedValue } from "../src/lib/path";
import { CERTAINTIES } from "../src/lib/certainty";
import { CHAPTERS, EXTRA_STATEMENT, QUESTIONS, deterministicSummary, fallbackFollowUps } from "../src/lib/journey";
import { t } from "../src/lib/i18n";
import type { Resident, SourceId } from "../src/lib/model";

let n = 0;
const check = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log(`ok  ${name}`);
};

function inputFor(r: Resident, sources: Record<SourceId, boolean> = ALL_SOURCES, extra: Record<string, string | string[]> = {}, values: ReportedValue[] = []): PathInput {
  const { resident, reported } = applyAnswers(r, { ...answersFromRecords(r), ...extra });
  const record = visibleRecord(resident, sources, sources.self ? reported : null);
  return {
    record,
    signals: signalsFor(record),
    measures: measureViews(record),
    factors: factorsFor(record),
    sources,
    confirmedValues: sources.lab ? values : [],
    scanning: true,
  };
}
const hero = (id: string) => HEROES.find((h) => h.id === id)!;
const statements = (input: PathInput) =>
  buildChapters(input).flatMap((c) => [...c.statements, ...c.measures.map((m) => m.statement), ...c.signals.flatMap((s) => s.statements)]);

const TSH = (value: number, refLow: number | null, refHigh: number | null): ReportedValue => ({ code: "tsh", name: "TSH", value, unit: "mIU/L", date: "2026-10-30", refLow, refHigh });
const variants: PathInput[] = HEROES.flatMap((h) => [
  inputFor(h),
  inputFor(h, { ...ALL_SOURCES, lab: false }),
  inputFor(h, { ...ALL_SOURCES, self: false }),
  inputFor(h, { self: false, malaffi: false, lab: false, healthAge: false, device: false }),
  inputFor(h, ALL_SOURCES, { partner: "yes", pregnantBefore: "no", fatheredBefore: "yes", stress: "high", activity: "rarely", heat: "often", cycles: "irregular", symptoms: "both", steroids: "past", maleHistory: ["mumps"] }, [TSH(5.9, 0.4, 4), TSH(2.1, 0.4, 4), TSH(2.1, null, null)]),
]);

check("every statement carries exactly one known certainty label", () => {
  for (const v of variants) for (const s of statements(v)) assert.ok(CERTAINTIES.includes(s.kind), JSON.stringify(s));
});

check("Noura: findings in Egg reserve and Family history, with trend, evidence and limits", () => {
  const ch = buildChapters(inputFor(hero("noura")));
  const reserve = ch.find((c) => c.id === "reserve")!;
  assert.equal(reserve.signals[0].code, "AMH_FALL");
  const kinds = reserve.signals[0].statements.map((s) => s.kind);
  assert.deepEqual(kinds, ["trend", "evidence", "unknown"]);
  assert.equal(ch.find((c) => c.id === "family")!.signals[0].code, "FAMILY_EARLY_MENOPAUSE");
  assert.equal(ch[0].signals.length > 0, true, "chapters with findings come first");
});

check("switching Lab results off removes the egg-reserve finding and says what is hidden", () => {
  const ch = buildChapters(inputFor(hero("noura"), { ...ALL_SOURCES, lab: false }));
  const reserve = ch.find((c) => c.id === "reserve")!;
  assert.equal(reserve.signals.length, 0);
  assert.ok(reserve.statements.some((s) => s.kind === "unknown" && /Lab results is off/.test(s.line.text)));
});

check("evidence statements only ever come from a rule's own text, with its citation", () => {
  for (const v of variants) {
    for (const c of buildChapters(v)) {
      assert.ok(!c.statements.some((s) => s.kind === "evidence"), `context in ${c.id} must not claim evidence`);
      for (const sig of c.signals) for (const s of sig.statements.filter((x) => x.kind === "evidence")) assert.ok(s.meta?.vars?.citation);
    }
  }
});

check("unused answers are shown as context and raise no finding", () => {
  const base = inputFor(hero("maryam"));
  const withContext = inputFor(hero("maryam"), ALL_SOURCES, { partner: "yes", pregnantBefore: "no", stress: "high", activity: "rarely" });
  assert.deepEqual(withContext.signals, base.signals);
  const plans = buildChapters(withContext).find((c) => c.id === "plans")!;
  assert.ok(plans.statements.some((s) => s.kind === "said" && s.line.text === "You have a partner."));
  assert.ok(plans.statements.some((s) => s.kind === "said" && s.line.text === "You haven't been pregnant before."));
});

check("TSH is shown only against the lab's printed range, and never interpreted", () => {
  const ch = buildChapters(inputFor(hero("noura"), ALL_SOURCES, {}, [TSH(5.9, 0.4, 4), TSH(2.1, null, null)]));
  const lines = ch.find((c) => c.id === "metabolic")!.statements.map((s) => s.line.text);
  assert.ok(lines.some((x) => x.includes("Outside the range the lab printed")));
  assert.ok(lines.some((x) => x.includes("didn't print a reference range")));
  assert.ok(lines.some((x) => x.includes("doesn't interpret thyroid")));
  assert.ok(!lines.some((x) => /thyroid (problem|disease|condition)|hypothyroid|fertility/i.test(x) && !x.includes("doesn't")));
  const off = buildChapters(inputFor(hero("noura"), { ...ALL_SOURCES, lab: false }, {}, [TSH(5.9, 0.4, 4)]));
  assert.ok(!off.flatMap((c) => c.statements).some((s) => s.line.text.startsWith("Thyroid (TSH)")));
});

check("HbA1c is shown as recorded data and trend, with no reproductive conclusion", () => {
  const r = hero("arjun");
  const withA1c = { ...r, readings: [...r.readings, { code: "hba1c" as const, value: 5.4, unit: "%", at: "2025-10-01", source: "lab" as const }, { code: "hba1c" as const, value: 5.9, unit: "%", at: "2026-10-01", source: "lab" as const }] };
  const ch = buildChapters(inputFor(withA1c));
  const metabolic = ch.find((c) => c.id === "metabolic")!;
  assert.ok(metabolic.measures.some((m) => m.view.def.code === "hba1c"));
  assert.ok(metabolic.statements.some((s) => s.kind === "unknown" && s.line.text.includes("draws no conclusion about fertility")));
  assert.ok(!ch.flatMap((c) => c.signals).some((s) => /HbA1c|sugar/i.test(s.title)));
});

check("headlines follow the rules' timing and never reassure", () => {
  const noura = inputFor(hero("noura"));
  assert.match(headline(noura.signals, topUrgency(noura.signals), true).emphasis.text, /soon/);
  const maryam = inputFor(hero("maryam"));
  const h = headline(maryam.signals, null, true);
  assert.match(h.emphasis.text, /isn't a guarantee/);
  assert.match(headline([], null, false).line.text, /paused/);
});

check("coverage is a list, never a score", () => {
  for (const v of variants) for (const c of coverage(v)) assert.ok(["on", "missing", "off"].includes(c.status));
  const none = coverage(inputFor(hero("noura"), { self: false, malaffi: false, lab: false, healthAge: false, device: false }));
  assert.ok(none.filter((c) => c.label !== "A recent weight measurement").every((c) => c.status === "off"));
});

check("every resident-facing sentence on the path has Arabic", () => {
  const texts = new Set<string>();
  const addLine = (l?: { text: string; vars?: Record<string, string | number> }) => {
    if (!l) return;
    texts.add(l.text);
    for (const x of Object.values(l.vars ?? {})) if (typeof x === "string" && !/^[\d.\s]+$/.test(x) && !/\(\d{4}\)|guideline|opinion|manual|NICE|ESHRE|ASRM|WHO|ACOG|ASCO|AUA|FIGO|ATA/.test(x)) texts.add(x);
  };
  for (const v of variants) {
    for (const c of buildChapters(v)) {
      texts.add(c.title);
      addLine(c.summary);
      for (const s of [...c.statements, ...c.measures.map((m) => m.statement), ...c.signals.flatMap((x) => x.statements)]) {
        addLine(s.line);
        addLine(s.meta);
      }
      for (const s of c.signals) [s.title, s.ask].forEach((x) => texts.add(x));
    }
    for (const c of coverage(v)) [c.label, c.why].forEach((x) => texts.add(x));
    const h = headline(v.signals, topUrgency(v.signals), true);
    addLine(h.line);
    addLine(h.emphasis);
  }
  addLine(headline([], null, false).line);
  addLine(headline([], null, false).emphasis);
  // Literal strings passed to t()/tr() on the resident screens.
  const files = [
    "src/app/me/page.tsx",
    "src/app/me/reports.tsx",
    "src/app/me/privacy/page.tsx",
    "src/app/me/about/page.tsx",
    "src/components/editorial.tsx",
    "src/components/path-line.tsx",
    "src/components/measure-strip.tsx",
    "src/components/companion.tsx",
    "src/components/onboarding.tsx",
    "src/components/health-questions.tsx",
    "src/components/report-upload.tsx",
    "src/components/delete-data.tsx",
    "src/components/journey/consent-step.tsx",
    "src/components/journey/questions-step.tsx",
    "src/components/journey/knowledge-step.tsx",
    "src/components/journey/preparing-step.tsx",
    "src/components/journey/final-step.tsx",
    "src/components/journey/about-editor.tsx",
    "src/components/dashboard/sections.tsx",
    "src/app/me/report/page.tsx",
    "src/app/how-masar-decides/page.tsx",
    "src/server/ai/companion.ts",
    "src/components/prototype/app.tsx",
    "src/components/prototype/controls.tsx",
    "src/components/prototype/patient.tsx",
    "src/components/prototype/dashboard.tsx",
    "src/components/prototype/clinician.tsx",
    "src/components/prototype/system.tsx",
    "src/components/prototype/core.tsx",
    "src/components/prototype/state.ts",
  ];
  for (const f of files) {
    const src = fs.readFileSync(path.join(__dirname, "..", f), "utf8");
    for (const m of src.matchAll(/\b(?:t|tr)\(\s*(?:lang,\s*)?"((?:[^"\\]|\\.)+)"/g)) texts.add(m[1].replace(/\\"/g, '"'));
  }
  // The journey: every question, option, explanation and note, the fallback questions, and the quick check.
  for (const q of QUESTIONS) {
    [q.text, q.why, ...q.options.map((o) => o.label), q.note?.text ?? ""].forEach((x) => x && texts.add(x));
  }
  for (const c of CHAPTERS) [c.title, c.body].forEach((x) => texts.add(x));
  for (const sex of ["female", "male"] as const) {
    for (const q of fallbackFollowUps(sex, { goal: "now", cycleChange: "irregular", familyHistory: "yes" })) [q.text, q.why, ...q.options.map((o) => o.label)].forEach((x) => texts.add(x));
    for (const q of fallbackFollowUps(sex, {})) [q.text, q.why, ...q.options.map((o) => o.label)].forEach((x) => texts.add(x));
  }
  [EXTRA_STATEMENT.text, EXTRA_STATEMENT.explain].forEach((x) => texts.add(x));
  // The public rules page: each rule's trigger and each threshold's basis.
  [...Object.values(TRIGGER), ...Object.values(MEASURE_BASIS)].forEach((x) => texts.add(x));
  for (const x of Object.values(deterministicSummary({ goals: [], history: [], changes: [], lifestyle: [], help: [], followUps: [], records: [], findings: [], missing: [], ruleQuestions: [], wantsQuestions: true })) as string[][]) x.forEach((y) => texts.add(y));
  // Sentences handed to components as props or kept in tables (consent terms, why-we-ask).
  for (const f of [
    "src/components/onboarding.tsx",
    "src/components/health-questions.tsx",
    "src/components/journey/consent-step.tsx",
    "src/components/journey/questions-step.tsx",
    "src/components/journey/knowledge-step.tsx",
    "src/components/journey/preparing-step.tsx",
    "src/components/journey/final-step.tsx",
    "src/components/journey/about-editor.tsx",
    "src/components/dashboard/sections.tsx",
    "src/lib/dashboard.ts",
    "src/lib/measure-info.ts",
    "src/lib/permissions.ts",
    "src/components/prototype/app.tsx",
    "src/components/prototype/controls.tsx",
    "src/components/prototype/patient.tsx",
    "src/components/prototype/dashboard.tsx",
    "src/components/prototype/clinician.tsx",
    "src/components/prototype/system.tsx",
    "src/components/prototype/core.tsx",
    "src/components/prototype/state.ts",
    "src/app/me/about/page.tsx",
    "src/app/me/privacy/page.tsx",
    "src/app/me/report/page.tsx",
  ]) {
    const src = fs.readFileSync(path.join(__dirname, "..", f), "utf8");
    for (const m of src.matchAll(/"([A-Z][^"\n]*\s[^"\n]*)"/g)) if (!/[{}<>=]/.test(m[1]) && !/^[A-Z_]+$/.test(m[1])) texts.add(m[1]);
  }
  const missing = [...texts].filter((x) => x && t("ar", x) === x && !/^[\d.\s{}:]+$/.test(x.replace(/{\w+}/g, "")) && !/^[A-Za-zµ%²]+\/[A-Za-z]+$/.test(x) && !/^M[\d.]/.test(x));
  if (missing.length) console.log(missing.map((m) => `  missing: ${JSON.stringify(m)}`).join("\n"));
  assert.deepEqual(missing, []);
});

console.log(`\n${n} path checks passed`);
