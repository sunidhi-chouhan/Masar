// The onboarding journey: conditional questions, the mapping onto Masar's
// existing rule inputs, the fallback questions and summary, and the Gemini
// layer's consent gating, validation and mock mode. Stubbed fetch and a
// throwaway data folder; nothing is sent anywhere.
// Run: npm run check  (or: npm run check:journey)
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "masar-journey-"));
process.env.MASAR_DATA_DIR = DIR;

const sent: string[] = [];
let raw: unknown = {};
globalThis.fetch = (async (_u: string | URL, init?: RequestInit) => {
  sent.push(String(init?.body ?? ""));
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(raw) }] } }] }), { status: 200 });
}) as typeof fetch;

async function main() {
  const J = await import("../src/lib/journey");
  const { questionsFor, answersFromRecords, applyAnswers } = await import("../src/lib/profile");
  const { HEROES } = await import("../src/lib/population");
  const { ALL_SOURCES, signalsFor, visibleRecord } = await import("../src/lib/signals");
  const { prohibited } = await import("../src/server/ai/guard");
  const store = await import("../src/server/store");
  const AI = await import("../src/server/ai/journey-ai");
  const JS = await import("../src/server/journey");

  let n = 0;
  const check = async (name: string, fn: () => void | Promise<void>) => {
    await fn();
    n++;
    console.log(`ok  ${name}`);
  };
  const hero = (id: string) => HEROES.find((h) => h.id === id)!;
  const codesFor = (id: string, ja: import("../src/lib/journey").JAnswers) => {
    const r = hero(id);
    const { resident, reported } = applyAnswers(r, J.toRuleAnswers(r.sex, ja));
    return signalsFor(visibleRecord(resident, ALL_SOURCES, reported)).map((s) => s.code);
  };
  const ids = (sex: "female" | "male", a: import("../src/lib/journey").JAnswers) => J.visibleQuestions(sex, a).map((q) => q.id);

  // ---------- conditional questions ----------
  await check("follow-ups appear only when an earlier answer makes them relevant", () => {
    assert.ok(!ids("female", {}).includes("cycleSince"));
    assert.ok(ids("female", { cycleChange: "irregular" }).includes("cycleSince"));
    assert.ok(!ids("female", { cycleChange: "none" }).includes("cycleSince"));
    assert.ok(!ids("female", {}).includes("thyroidKind"));
    assert.ok(ids("female", { diagnoses: ["thyroid"] }).includes("thyroidKind"));
    assert.ok(ids("male", { otherConditions: ["thyroid"] }).includes("thyroidKindLife"));
    assert.ok(!ids("female", { goal: "not" }).includes("pregnantBefore"));
    assert.ok(ids("female", { goal: "now" }).includes("pregnantBefore"));
    assert.ok(ids("female", { familyHistory: "yes" }).includes("familyWhich"));
    assert.ok(ids("female", { medicalTreatment: "yes" }).includes("medicalTreatmentWhen"));
    assert.ok(!ids("female", {}).includes("periodPain") === false, "period pain is asked unless cycles are not applicable or absent");
    assert.ok(!ids("female", { cycleChange: "absent" }).includes("periodPain"));
  });

  await check("questions follow each person's body: menstrual questions for women, sperm-related for men", () => {
    assert.ok(ids("female", {}).includes("cycleChange") && !ids("male", {}).includes("cycleChange"));
    assert.ok(ids("male", {}).includes("steroids") && !ids("female", {}).includes("steroids"));
  });

  await check("a follow-up always comes straight after the question it follows", () => {
    const list = ids("female", { cycleChange: "missed", diagnoses: ["thyroid"], familyHistory: "yes", treatment: "yes", medicalTreatment: "yes", goal: "now" });
    for (const [follow, parent] of [
      ["cycleSince", "cycleChange"],
      ["thyroidKind", "diagnoses"],
      ["familyWhich", "familyHistory"],
      ["treatmentNow", "treatment"],
      ["medicalTreatmentWhen", "medicalTreatment"],
    ]) {
      assert.ok(list.indexOf(follow) > list.indexOf(parent), `${follow} after ${parent}`);
    }
  });

  // ---------- mapping onto the rules' inputs ----------
  await check("every mapped answer is a real option of Masar's original questions", () => {
    for (const sex of ["female", "male"] as const) {
      const all: import("../src/lib/journey").JAnswers = {};
      for (const q of J.QUESTIONS) if (!q.sex || q.sex === sex) all[q.id] = q.multi ? q.options.map((o) => o.value) : q.options[1]?.value ?? q.options[0].value;
      for (const q of J.QUESTIONS) {
        if (q.sex && q.sex !== sex) continue;
        for (const o of q.options) {
          const mapped = J.toRuleAnswers(sex, { ...all, [q.id]: q.multi ? [o.value] : o.value });
          for (const [k, v] of Object.entries(mapped)) {
            const orig = questionsFor(sex).find((x) => x.id === k) ?? (k === "maleHistory" ? undefined : undefined);
            if (k === "maleHistory" || k === "partner") continue;
            if (!orig) continue;
            const allowed = new Set(orig.options.map((x) => x.value));
            for (const x of Array.isArray(v) ? v : [v]) assert.ok(allowed.has(x), `${k}=${x} from ${q.id}=${o.value}`);
          }
        }
      }
    }
  });

  await check("family history raises Masar's existing rule only for menopause before 45, as before", () => {
    const base = { goal: "future", familyHistory: "yes" };
    assert.ok(codesFor("noura", { ...base, familyWhich: ["menopause"] }).includes("FAMILY_EARLY_MENOPAUSE"));
    assert.ok(!codesFor("noura", { ...base, familyWhich: ["other"] }).includes("FAMILY_EARLY_MENOPAUSE"));
  });

  await check("cycle and period answers feed the existing cycle and symptom rules", () => {
    assert.ok(codesFor("maryam", { cycleChange: "irregular" }).includes("CYCLE_IRREGULAR"));
    assert.ok(codesFor("maryam", { cycleChange: "absent" }).includes("CYCLE_IRREGULAR"));
    assert.ok(!codesFor("maryam", { cycleChange: "none", periodPain: "none" }).includes("CYCLE_IRREGULAR"));
    assert.ok(codesFor("maryam", { periodPain: "both" }).includes("PERIOD_SYMPTOMS"));
  });

  await check("an underactive thyroid (but not 'thyroid condition' alone) counts as the existing condition", () => {
    const r = J.toRuleAnswers("female", { diagnoses: ["thyroid"] });
    assert.ok(!(r.conditions as string[] | undefined)?.includes("hypothyroid"));
    const u = J.toRuleAnswers("female", { diagnoses: ["thyroid"], thyroidKind: "under" });
    assert.ok((u.conditions as string[]).includes("hypothyroid"));
  });

  await check("men's answers feed the existing male rules unchanged", () => {
    assert.ok(codesFor("arjun", { goal: "soon", steroids: "past" }).includes("MALE_STEROIDS"));
    assert.ok(codesFor("arjun", { goal: "soon", maleHistory: ["mumps"] }).includes("MALE_HISTORY"));
    assert.ok(!codesFor("arjun", { goal: "soon", maleHistory: ["none"] }).includes("MALE_HISTORY"));
  });

  await check("round trip: each resident's existing answers give the same findings through the journey", () => {
    for (const h of HEROES) {
      const before = signalsFor(visibleRecord(applyAnswers(h, answersFromRecords(h)).resident, ALL_SOURCES, applyAnswers(h, answersFromRecords(h)).reported)).map((s) => s.code);
      const ja = J.fromRuleAnswers(h.sex, answersFromRecords(h));
      assert.deepEqual(codesFor(h.id, ja), before, h.id);
    }
  });

  await check("context-only answers (partner, sleep, concern, help) never raise a finding", () => {
    const base = codesFor("maryam", {});
    assert.deepEqual(codesFor("maryam", { partnerContext: "yes", sleep: "often", concern: "family", helpful: ["missing"], prepareQuestions: "yes", investigations: ["none"] }), base);
  });

  // ---------- fallback questions and the deterministic summary ----------
  await check("Masar's own final questions: exactly two, relevant, and free of anything the guard refuses", () => {
    for (const sex of ["female", "male"] as const) {
      for (const a of [{}, { goal: "now" }, { cycleChange: "irregular" }, { familyHistory: "yes" }] as import("../src/lib/journey").JAnswers[]) {
        const qs = J.fallbackFollowUps(sex, a);
        assert.equal(qs.length, 2);
        for (const q of qs) for (const s of [q.text, q.why, ...q.options.map((o) => o.label)]) assert.equal(prohibited(s), null, s);
      }
    }
    assert.equal(J.fallbackFollowUps("female", { cycleChange: "irregular" })[0].id, "fu-cycle-since");
  });

  const input = {
    goals: ["What best describes your current reproductive plans? Trying to conceive now"],
    history: ["Have you ever been diagnosed with any reproductive or hormonal conditions? PCOS"],
    changes: ["Have you experienced changes in your menstrual cycle? Irregular periods"],
    lifestyle: [],
    help: [],
    followUps: [],
    records: ["Egg-reserve hormone (AMH): 1.3 ng/mL (2026-09-30)"],
    findings: ["A drop in your egg-reserve hormone (AMH)"],
    missing: ["Cycle dates: Not shared"],
    ruleQuestions: ["What does the fall in my AMH mean for my plans?"],
    wantsQuestions: true,
  };

  await check("Masar's own summary uses only its inputs, keeps uncertainty, and says what it isn't", () => {
    const s = J.deterministicSummary(input);
    for (const k of J.SUMMARY_KEYS) for (const x of s[k]) assert.equal(prohibited(x), null, x);
    assert.ok(s.limitations.some((x) => /not a diagnosis/.test(x)));
    assert.ok(s.limitations.some((x) => /not clinically verified/.test(x)));
    assert.deepEqual(s.areas_to_explore, input.findings);
    assert.deepEqual(s.missing_information, input.missing);
    const none = J.deterministicSummary({ ...input, findings: [] });
    assert.match(none.areas_to_explore[0], /isn't a guarantee/);
  });

  // ---------- the Gemini layer ----------
  const ALL = { self: true, malaffi: true, lab: true, healthAge: true, device: true };
  const setup = (change: Partial<import("../src/server/store").PersonState>) => {
    store.resetPerson("maryam");
    store.updatePerson("maryam", (p) => ({ ...p, sources: { ...ALL }, ...change }));
  };
  const fuOpts = { personId: "maryam", sex: "female" as const, ageBand: "25–29", answers: { goal: "now", cycleChange: "irregular" }, answered: ["Plans: Trying to conceive now"], lang: "en" as const };
  const good = {
    questions: [
      { text: "Have you noticed any recent changes in how often your periods come?", why: "It helps your doctor understand the change.", options: ["No", "More irregular", "Unsure"] },
      { text: "Would you like help preparing questions about tests?", why: "Only a doctor decides whether a test would help.", options: ["Yes", "No", "Maybe later"] },
    ],
  };

  process.env.GEMINI_API_KEY = "test-key-not-real";

  await check("without assistant consent, the final questions are Masar's own and nothing is sent", async () => {
    setup({ assistantConsent: false });
    sent.length = 0;
    const r = await AI.makeFollowUps(fuOpts);
    assert.equal(r.source, "fallback");
    assert.equal(sent.length, 0);
  });

  await check("with assistant consent but 'What you tell us' off, answers are not sent", async () => {
    setup({ assistantConsent: true, sources: { ...ALL, self: false } });
    sent.length = 0;
    assert.equal((await AI.makeFollowUps(fuOpts)).source, "fallback");
    assert.equal(sent.length, 0);
  });

  await check("with consent, Gemini's two questions are used, with an opt-out option added", async () => {
    setup({ assistantConsent: true });
    sent.length = 0;
    raw = good;
    const r = await AI.makeFollowUps(fuOpts);
    assert.equal(r.source, "ai");
    assert.equal(r.questions.length, 2);
    assert.ok(r.questions[1].options.some((o) => o.label === "Prefer not to say"));
    assert.equal(sent.length, 1);
    assert.ok(!/Maryam|Haddad/.test(sent[0]), "no name is sent");
    assert.ok(store.accessLog("maryam").some((a) => a.what === "Read your answers to choose two final questions"));
  });

  for (const [why, bad] of [
    ["three questions", { questions: [...good.questions, good.questions[0]] }],
    ["a sensitive topic", { questions: [{ ...good.questions[0], text: "Have you had a miscarriage before?" }, good.questions[1]] }],
    ["a pregnancy chance", { questions: [{ ...good.questions[0], why: "Your chances are good." }, good.questions[1]] }],
    ["a malformed shape", { items: [] }],
  ] as const) {
    await check(`Gemini questions with ${why} fall back to Masar's own`, async () => {
      setup({ assistantConsent: true });
      raw = bad;
      assert.equal((await AI.makeFollowUps(fuOpts)).source, "fallback");
    });
  }

  const tr = (s: string) => s;
  await check("summary: no consent means Masar's own summary and no request", async () => {
    setup({ assistantConsent: false });
    sent.length = 0;
    const r = await AI.makeSummary({ personId: "maryam", input, lang: "en", tr });
    assert.equal(r.source, "masar");
    assert.equal(sent.length, 0);
  });

  await check("summary: Gemini's structured summary is used when it passes Masar's checks", async () => {
    setup({ assistantConsent: true });
    raw = { ...J.deterministicSummary(input), reproductive_goals: ["You are trying to conceive now (self-reported)."] };
    const r = await AI.makeSummary({ personId: "maryam", input, lang: "en", tr });
    assert.equal(r.source, "ai");
  });

  await check("summary: an invented value, a diagnosis or a missing key falls back to Masar's own", async () => {
    setup({ assistantConsent: true });
    for (const bad of [
      { ...J.deterministicSummary(input), known_information: ["Your AMH is 0.4 ng/mL."] },
      { ...J.deterministicSummary(input), areas_to_explore: ["This means you have diminished ovarian reserve."] },
      { ...J.deterministicSummary(input), limitations: undefined },
    ]) {
      raw = bad;
      assert.equal((await AI.makeSummary({ personId: "maryam", input, lang: "en", tr })).source, "masar");
    }
  });

  // ---------- mock mode ----------
  delete process.env.GEMINI_API_KEY;
  process.env.GEMINI_MOCK = "1";

  await check("mock mode: labelled as mock, still consent-gated and logged, and no request is made", async () => {
    setup({ assistantConsent: true });
    sent.length = 0;
    const q = await AI.makeFollowUps(fuOpts);
    assert.equal(q.source, "mock");
    assert.equal(q.questions.length, 2);
    const s = await AI.makeSummary({ personId: "maryam", input, lang: "en", tr });
    assert.equal(s.source, "mock");
    assert.equal(s.model, "mock");
    assert.equal(sent.length, 0);
    assert.ok(store.accessLog("maryam").some((a) => /demo mock, no live model call/.test(a.what)));
    setup({ assistantConsent: false });
    assert.equal((await AI.makeFollowUps(fuOpts)).source, "fallback");
  });

  delete process.env.GEMINI_MOCK;
  await check("with no key and no mock, everything falls back to Masar's own", async () => {
    setup({ assistantConsent: true });
    assert.equal((await AI.makeFollowUps(fuOpts)).source, "fallback");
    assert.equal((await AI.makeSummary({ personId: "maryam", input, lang: "en", tr })).source, "masar");
  });

  await check("a stored record from before the journey existed reads as a fresh journey", () => {
    fs.writeFileSync(path.join(DIR, "state.json"), JSON.stringify({ persons: { noura: { onboarded: true } }, access: [] }));
    const p = store.person("noura");
    assert.deepEqual(p.journey.answers, {});
    assert.equal(p.journey.summary, null);
  });

  // ---------- consent before anything is kept ----------
  const draft = {
    answers: { goal: "now", cycleChange: "irregular", cycleSince: "3to12", diagnoses: ["thyroid", "made-up"], thyroidKind: "under", steroids: "past" },
    knowledge: ["false", "unsure", "true", "false"],
    worry: 2,
  };

  await check("with 'Your answers' off, nothing from the journey is kept, and anything kept before is removed", () => {
    store.resetPerson("maryam");
    store.updatePerson("maryam", (p) => ({ ...p, journey: { ...p.journey, answers: { goal: "soon" }, followUps: { source: "fallback", model: null, at: "x", basis: "y", questions: [] }, followUpAnswers: { a: "b" } } }));
    const p = store.person("maryam");
    assert.equal(p.sources.self, false, "off by default");
    const r = JS.applyJourneyCommit(p, "female", draft);
    assert.equal(r.stored, false);
    assert.deepEqual(r.next.journey.answers, {});
    assert.equal(r.next.answers, null);
    assert.equal(r.next.beliefsBefore, null);
    assert.equal(r.next.journey.followUps, null);
    assert.deepEqual(r.next.journey.followUpAnswers, {});
  });

  await check("with 'Your answers' on, only real, visible answers are kept and mapped onto the rules' inputs", () => {
    store.resetPerson("maryam");
    store.updatePerson("maryam", (p) => ({ ...p, sources: { ...p.sources, self: true } }));
    const r = JS.applyJourneyCommit(store.person("maryam"), "female", draft);
    assert.equal(r.stored, true);
    assert.deepEqual(r.next.journey.answers.diagnoses, ["thyroid"], "an invented option is dropped");
    assert.equal(r.next.journey.answers.steroids, undefined, "a men-only question is dropped for a woman");
    assert.equal(r.next.journey.answers.cycleSince, "3to12");
    assert.ok((r.next.answers?.conditions as string[]).includes("hypothyroid"));
    assert.deepEqual(r.next.beliefsBefore, ["false", "unsure", "true"]);
    assert.equal(r.next.journey.knowledgeExtra, "false");
    assert.equal(r.next.worryBefore, 2);
    const hidden = JS.applyJourneyCommit(store.person("maryam"), "female", { ...draft, answers: { cycleChange: "none", cycleSince: "3to12" } });
    assert.equal(hidden.next.journey.answers.cycleSince, undefined, "a follow-up that no longer applies is dropped");
  });

  await check("About you and the quick check never call the server: their answers stay in the browser until permissions", () => {
    for (const f of ["src/components/journey/questions-step.tsx", "src/components/journey/knowledge-step.tsx"]) {
      const src = fs.readFileSync(path.join(__dirname, "..", f), "utf8");
      assert.ok(!/from "@\/server/.test(src), `${f} imports server code`);
    }
    const shell = fs.readFileSync(path.join(__dirname, "..", "src/components/onboarding.tsx"), "utf8");
    assert.match(shell, /selfOn \? \{ answers: draft\.answers/, "answers are sent only when 'Your answers' is on");
  });

  await check("preparing the path can't skip its own run (the 0/4 hang under React's development double-run)", () => {
    const src = fs.readFileSync(path.join(__dirname, "..", "src/components/journey/preparing-step.tsx"), "utf8");
    assert.ok(!/started\.current\s*===/.test(src), "a 'started' ref guard makes the second development run return early");
    assert.match(src, /await Promise\.resolve\(\);\s*if \(!live\) return;/, "a cancelled run must stop before calling the server");
    assert.match(src, /withTimeout\(/, "every step has a time limit");
  });

  console.log(`\n${n} journey checks passed`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => fs.rmSync(DIR, { recursive: true, force: true }));
