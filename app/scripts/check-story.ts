// Plain assertions that the data layer tells the story. No server needed.
// Run: npm run check
import assert from "node:assert/strict";
import { GROUP_LABEL, LANGUAGE_LABEL } from "../src/lib/model";
import { HEROES, population } from "../src/lib/population";
import { SOURCES } from "../src/lib/model";
import { ALL_SOURCES, OPTION_LABEL, RULES, clinicalReason, signalsFor, visibleRecord } from "../src/lib/signals";
import { MEASURES, factorsFor, measureViews } from "../src/lib/trajectory";
import { report } from "../src/lib/evidence";
import { answersFromRecords, applyAnswers, questionsFor } from "../src/lib/profile";
import { beliefItems } from "../src/lib/checks";
import { t } from "../src/lib/i18n";

let n = 0;
const check = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log(`ok  ${name}`);
};
const hero = (id: string) => HEROES.find((h) => h.id === id)!;
const codes = (id: string, sources = ALL_SOURCES) => signalsFor(visibleRecord(hero(id), sources)).map((s) => s.code);

check("Noura gets the family-history and AMH signals", () => {
  assert.deepEqual(codes("noura"), ["FAMILY_EARLY_MENOPAUSE", "AMH_FALL"]);
});

check("switching off lab results removes the AMH signal", () => {
  assert.deepEqual(codes("noura", { ...ALL_SOURCES, lab: false }), ["FAMILY_EARLY_MENOPAUSE"]);
});

check("Noura's AMH fall is meaningful and her cycles are normal variation", () => {
  const views = measureViews(visibleRecord(hero("noura"), ALL_SOURCES));
  assert.equal(views.find((v) => v.def.code === "amh")?.verdict, "meaningful");
  assert.equal(views.find((v) => v.def.code === "cycle_length")?.verdict, "normal");
});

check("Arjun gets the lifestyle signal", () => {
  assert.deepEqual(codes("arjun"), ["MALE_LIFESTYLE"]);
});

check("Maryam gets no signal", () => {
  assert.deepEqual(codes("maryam"), []);
});

check("the population is deterministic", () => {
  assert.equal(population().length, 10_003);
  assert.equal(population()[3].id, "R00001");
});

check("the report has plausible shape", () => {
  const r = report({ group: (g) => GROUP_LABEL[g], language: (l) => LANGUAGE_LABEL[l] });
  console.log(JSON.stringify({ optedIn: r.optedIn, signalled: r.signalled, funnel: r.funnel, within: r.withinDays, medMasar: r.medianMasarDays, medUsual: r.medianUsualDays, fr: r.falseReassurance, know: r.knowledge, sure: r.surePct, anx: r.anxiety, rules: r.rules.map((x) => [x.code, x.n, x.agreePct]) }));
  assert.ok(r.signalled > 300 && r.signalled < r.optedIn);
  assert.ok((r.medianMasarDays ?? 0) < (r.medianUsualDays ?? Infinity));
});

check("answers drive new signals for women and men", () => {
  const withAnswers = (id: string, extra: Record<string, string | string[]>) => {
    const r = hero(id);
    const { resident, reported } = applyAnswers(r, { ...answersFromRecords(r), ...extra });
    return signalsFor(visibleRecord(resident, ALL_SOURCES, reported)).map((x) => x.code);
  };
  assert.ok(withAnswers("arjun", { steroids: "past" }).includes("MALE_STEROIDS"));
  assert.ok(withAnswers("maryam", { symptoms: "pain" }).includes("PERIOD_SYMPTOMS"));
  assert.ok(withAnswers("maryam", { cycles: "irregular" }).includes("CYCLE_IRREGULAR"));
  assert.deepEqual(withAnswers("maryam", {}), []);
});

check("switching off what you tell us ignores the answers", () => {
  const r = hero("arjun");
  const { resident, reported } = applyAnswers(r, { steroids: "now" });
  const codes = signalsFor(visibleRecord(resident, { ...ALL_SOURCES, self: false }, reported)).map((x) => x.code);
  assert.ok(!codes.includes("MALE_STEROIDS"));
});

check("being underweight with plans is flagged, and reads clinically for the doctor", () => {
  const r = hero("maryam");
  const thin = { ...r, intention: "MaybeLater" as const, readings: [...r.readings, { code: "bmi" as const, value: 17.2, unit: "kg/m²", at: "2026-11-08", source: "healthAge" as const }] };
  const s = signalsFor(visibleRecord(thin, ALL_SOURCES)).find((x) => x.code === "UNDERWEIGHT_PLANS");
  assert.ok(s, "expected UNDERWEIGHT_PLANS");
  assert.equal(clinicalReason(s.reasons[0]), "BMI 17.2 (underweight)");
});

check("everything a resident reads has an Arabic translation", () => {
  const texts = [
    ...Object.values(RULES).flatMap((r) => [r.title, r.whyItMatters, r.cannotTell, ...r.questions]),
    ...Object.values(OPTION_LABEL).flatMap((o) => [o.title, o.body, o.next]),
    ...SOURCES.flatMap((s) => [s.label, s.detail]),
    ...(["female", "male"] as const).flatMap((sex) => [
      ...questionsFor(sex).flatMap((q) => [q.text, ...q.options.map((o) => o.label)]),
      ...beliefItems(sex).flatMap((b) => [b.text, b.explain]),
    ]),
    ...MEASURES.flatMap((m) => [m.label, m.rule]),
    ...HEROES.flatMap((h) => {
      const v = visibleRecord(h, ALL_SOURCES);
      return [...signalsFor(v).flatMap((s) => s.reasons), ...measureViews(v).map((m) => m.sentence), ...factorsFor(v).flatMap((f) => [f.label, f.value, f.note])];
    }),
  ];
  const missing = [...new Set(texts)].filter((x) => t("ar", x) === x && !/^[\d.\s]+$/.test(x));
  assert.deepEqual(missing, []);
});

console.log(`\n${n} checks passed`);
