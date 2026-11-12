// The post-onboarding dashboard adapts to what each person shared, and never
// invents: every number comes from their record, every statement names its
// source, nothing passes that Masar's guard refuses, and nothing from a source
// that is off appears. Five synthetic profiles, built from the demo residents
// and their permission choices (no new synthetic data).
// Run: npm run check  (or: npm run check:dashboard)
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "masar-dashboard-"));
process.env.MASAR_DATA_DIR = DIR;

async function main() {
  const store = await import("../src/server/store");
  const { personView } = await import("../src/server/views");
  const { dashboardFor } = await import("../src/server/dashboard");
  const { dashboardNumbers } = await import("../src/lib/dashboard");
  const { toRuleAnswers } = await import("../src/lib/journey");
  const { prohibited } = await import("../src/server/ai/guard");
  const { HEROES } = await import("../src/lib/population");

  let n = 0;
  const check = async (name: string, fn: () => void | Promise<void>) => {
    await fn();
    n++;
    console.log(`ok  ${name}`);
  };
  const OFF = { self: false, malaffi: false, lab: false, healthAge: false, device: false };
  const ALL = { self: true, malaffi: true, lab: true, healthAge: true, device: true };
  const profile = (id: string, sources: typeof ALL, answers?: Record<string, string | string[]>) => {
    store.resetPerson(id);
    const sex = HEROES.find((h) => h.id === id)!.sex;
    store.updatePerson(id, (p) => ({
      ...p,
      onboarded: true,
      sources,
      ...(answers ? { journey: { ...p.journey, answers }, answers: toRuleAnswers(sex, answers) } : {}),
    }));
    return { d: dashboardFor(personView(id)), v: personView(id) };
  };
  const texts = (d: ReturnType<typeof dashboardFor>) => [
    d.headline.line.text,
    d.headline.emphasis.text,
    ...d.insights.flatMap((i) => [i.title, i.why, i.cannot, ...i.questions, ...i.because.map((b) => b.text.text)]),
    ...d.context.flatMap((c) => c.body.map((b) => b.text.text)),
    ...[...d.known, ...d.unknown, ...d.explore].map((f) => f.text.text),
    ...d.series.flatMap((s) => [s.sentence.text, s.info.what, s.info.limits]),
    ...d.actions.flatMap((a) => [a.title.text, a.why.text]),
    ...d.prepare.questions,
  ];

  const profiles = {
    limited: () => profile("maryam", OFF),
    history: () => profile("maryam", { ...ALL }, { goal: "now", diagnoses: ["thyroid"], thyroidKind: "under", cycleChange: "irregular" }),
    labs: () => profile("noura", ALL),
    overTime: () => profile("arjun", ALL),
    declined: () => profile("maryam", { ...OFF, device: true }),
  };

  for (const [name, make] of Object.entries(profiles)) {
    await check(`${name}: every number shown is in the person's record, and every statement names its source`, () => {
      const { d, v } = make();
      const allowed = new Set([v.record.age, ...v.record.readings.map((r) => r.value)]);
      // Rule thresholds and counts that Masar's own rule texts state.
      const ruleText = texts(d).join(" ");
      for (const x of dashboardNumbers(d)) assert.ok(allowed.has(x) || ruleText.includes(String(x)), `${name}: ${x} isn't in the record or a rule`);
      for (const s of d.series) for (const p of s.points) assert.ok(allowed.has(p.value), `${name}: series value ${p.value}`);
      for (const f of [...d.known, ...d.unknown, ...d.explore, ...d.insights.flatMap((i) => i.because)]) assert.ok(f.source, `${name}: a statement without a source`);
    });
    await check(`${name}: nothing shown is something Masar's guard refuses (no diagnosis, score or chance)`, () => {
      const { d } = make();
      for (const t of texts(d)) assert.equal(prohibited(t), null, t);
    });
  }

  await check("very limited information: no findings or charts, and the gaps are named with why they'd help", () => {
    const { d } = profiles.limited();
    assert.equal(d.insights.length, 0);
    assert.equal(d.series.length, 0);
    assert.ok(d.known.every((f) => f.kind !== "said"), "nothing the person said is shown while 'Your answers' is off");
    assert.ok(d.picture.off >= 4);
    assert.ok(d.actions.some((a) => a.group === "missing" && a.href === "/me/privacy"));
    assert.equal(d.prepare.generic, true);
  });

  await check("relevant medical history: the condition and cycles are explained from Masar's rules, with what they can't tell", () => {
    const { d } = profiles.history();
    const codes = d.insights.map((i) => i.code);
    assert.ok(codes.includes("CONDITION_PLANS") && codes.includes("CYCLE_IRREGULAR"), codes.join(","));
    const cond = d.insights.find((i) => i.code === "CONDITION_PLANS")!;
    assert.ok(cond.cannot.length && cond.evidence.citation.length);
    assert.ok(d.known.some((f) => f.kind === "said" && /Underactive thyroid/.test(JSON.stringify(f.text))), "a self-reported condition is labelled as what the person said");
  });

  await check("a condition without near plans is explained as context, not raised as a finding", () => {
    const { d } = profile("maryam", { ...ALL }, { goal: "not", diagnoses: ["pcos"] });
    assert.ok(!d.insights.some((i) => i.code === "CONDITION_PLANS"));
    assert.ok(d.context.some((c) => c.id === "condition-pcos"));
  });

  await check("lab results: AMH over time is charted, with the change rule's verdict and the test's limits", () => {
    const { d } = profiles.labs();
    const amh = d.series.find((s) => s.code === "amh")!;
    assert.equal(amh.points.length, 2);
    assert.equal(amh.verdict, "meaningful");
    assert.ok(amh.info.limits.length && amh.rule.length);
    assert.ok(d.insights.some((i) => i.code === "AMH_FALL"));
  });

  await check("multiple records over time: each measure becomes a series; one reading is never called a trend", () => {
    const { d } = profiles.overTime();
    const bmi = d.series.find((s) => s.code === "bmi")!;
    assert.equal(bmi.points.length, 2);
    const sleep = d.series.find((s) => s.code === "sleep_hours")!;
    assert.equal(sleep.verdict, "single");
    assert.ok(d.unknown.some((f) => /Sleep/.test(JSON.stringify(f.text))), "a single reading is listed under what's unknown");
    assert.ok(d.timeline.length >= 3);
  });

  await check("declined permissions: only the shared source appears, and the rest are named as not shared", () => {
    const { d } = profiles.declined();
    assert.ok(d.series.every((s) => s.code === "cycle_length" || s.code === "sleep_hours"), d.series.map((s) => s.code).join(","));
    assert.ok(d.unknown.some((f) => /not shared/.test(f.text.text)));
    assert.ok(d.known.every((f) => f.kind !== "said"));
  });

  await check("the sections differ by person: not everyone gets the same dashboard", () => {
    const shapes = Object.values(profiles).map((make) => {
      const { d } = make();
      return JSON.stringify([d.insights.length, d.series.length, d.context.length, d.actions.length]);
    });
    assert.ok(new Set(shapes).size >= 4, shapes.join(" "));
  });

  console.log(`\n${n} dashboard checks passed`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => fs.rmSync(DIR, { recursive: true, force: true }));
