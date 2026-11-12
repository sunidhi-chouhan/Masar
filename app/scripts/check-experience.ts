// The Experience Simulator must stay on Noura's existing rules, hide small
// groups, and stay isolated from Gemini, stored consent and demo accounts.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { experienceAggregates } from "../src/lib/experience/aggregates";
import { EXTRA, IMPACT, SCENES } from "../src/lib/experience/copy";
import { derive } from "../src/lib/experience/derive";
import { STORY_ANSWERS, stepsFor } from "../src/lib/experience/questions";
import { EMPTY_SOURCES, initialState, reducer } from "../src/lib/experience/state";
import { MIN_GROUP } from "../src/lib/evidence";
import { ALL_SOURCES, optionsFor, signalsFor, visibleRecord } from "../src/lib/signals";
import { HEROES } from "../src/lib/population";
import { applyAnswers } from "../src/lib/profile";

let n = 0;
const check = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log(`ok  ${name}`);
};

const full = { sources: { ...ALL_SOURCES }, scanning: true, answers: STORY_ANSWERS };
const noura = HEROES.find((h) => h.id === "noura")!;

check("Noura's prepared story keeps the two published signals", () => {
  const view = derive(full);
  assert.deepEqual(view.signals.map((s) => s.code), ["FAMILY_EARLY_MENOPAUSE", "AMH_FALL"]);
  const applied = applyAnswers(noura, STORY_ANSWERS);
  assert.deepEqual(
    view.options,
    optionsFor(signalsFor(visibleRecord(applied.resident, ALL_SOURCES, applied.reported))),
  );
});

check("an irregular-cycle answer adds only the existing cycle rule", () => {
  const view = derive({ ...full, answers: { ...STORY_ANSWERS, cycles: "irregular" } });
  assert.ok(view.signals.some((s) => s.code === "CYCLE_IRREGULAR"));
});

check("lab revocation removes AMH values and the AMH signal", () => {
  const view = derive({ ...full, sources: { ...ALL_SOURCES, lab: false } });
  const blob = JSON.stringify(view.observations);
  assert.ok(!view.signals.some((s) => s.code === "AMH_FALL"));
  assert.equal(view.record.readings.some((r) => r.code === "amh"), false);
  assert.ok(!blob.includes("1.3"));
  assert.ok(!blob.includes("2.4"));
});

check("switching off what she told us removes the family signal", () => {
  const view = derive({ ...full, sources: { ...ALL_SOURCES, self: false } });
  const blob = JSON.stringify(view.observations);
  assert.ok(!view.signals.some((s) => s.code === "FAMILY_EARLY_MENOPAUSE"));
  assert.ok(!blob.includes("menopause before 45"));
});

check("AMH is a meaningful change, cycles and BMI are not, sleep is unknown", () => {
  const view = derive(full);
  assert.equal(view.measures.find((m) => m.def.code === "amh")?.verdict, "meaningful");
  assert.equal(view.measures.find((m) => m.def.code === "cycle_length")?.verdict, "normal");
  assert.equal(view.measures.find((m) => m.def.code === "bmi")?.verdict, "normal");
  assert.equal(view.measures.find((m) => m.def.code === "sleep_hours")?.verdict, "single");
  const sleep = view.observations.find((o) => o.id === "sleep");
  assert.ok(sleep?.stanzas.every((s) => s.kind !== "steady"));
});

check("looking for a conversation starts off", () => {
  const state = initialState();
  assert.deepEqual(state.sources, EMPTY_SOURCES);
  assert.equal(state.scanning, false);
  assert.equal(state.assistant, false);
  assert.equal(state.reportReading, false);
  assert.equal(state.shareClinician, false);
  assert.equal(derive({ sources: state.sources, scanning: state.scanning, answers: {} }).signals.length, 0);
});

check("scene changes keep her answers", () => {
  let state = reducer(initialState(), { type: "fill-story" });
  state = reducer(state, { type: "next-scene" });
  assert.equal(state.scene, 1);
  assert.equal(state.answers.plans, "MaybeLater");
  assert.equal(state.answers.familyMenopause, "yes");
});

check("disagreeing without a reason does not record a decision", () => {
  const state = reducer(initialState(), { type: "decide", kind: "Override", note: "  " });
  assert.equal(state.decision, null);
});

check("symptoms are not asked when periods have been absent", () => {
  assert.equal(stepsFor({ cycles: "absent" }).some((s) => s.kind === "ask" && s.id === "symptoms"), false);
  assert.equal(stepsFor({}).some((s) => s.kind === "ask" && s.id === "symptoms"), true);
});

check("population counts hide groups under 10 and exclude Noura", () => {
  const report = experienceAggregates();
  const blob = JSON.stringify(report);
  assert.equal(report.minGroup, MIN_GROUP);
  assert.ok(report.cohorts.every((c) => c.n >= MIN_GROUP));
  assert.ok(report.equity.every((c) => c.n === null || c.n >= MIN_GROUP));
  assert.ok(report.gaps.every((g) => g.n === null || g.n >= MIN_GROUP));
  assert.ok(!blob.includes("Noura"));
  assert.ok(!blob.includes("Al Mansouri"));
  assert.ok(!blob.includes("ng/mL"));
});

check("impact copy states targets and does not invent a percentage", () => {
  for (const item of IMPACT) {
    assert.ok(item.definition.en.length > 20);
    assert.ok(item.definition.ar.length > 10);
    assert.ok(!item.definition.en.includes("%"));
    assert.ok(!item.data.en.includes("%"));
  }
  assert.equal(SCENES.length, 11);
  assert.equal(SCENES.at(-1)?.id, "outcome");
});

check("Arabic extra copy is present and avoids a fertility score", () => {
  for (const [en, ar] of Object.entries(EXTRA)) {
    assert.ok(ar.trim().length > 0, en);
    assert.ok(!/fertility score|risk score|infertile|pregnancy probability/i.test(en));
  }
});

check("the simulator does not import Gemini, stored state or server actions", () => {
  const roots = ["src/lib/experience", "src/components/experience", "src/app/access/experience"];
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ts|tsx)$/.test(name)) files.push(path);
    }
  };
  roots.forEach(walk);
  const banned = ["@/server/actions", "@/server/store", "@/server/ai", "gemini"];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const word of banned) assert.ok(!text.includes(word), `${file} mentions ${word}`);
  }
});

console.log(`\n${n} checks passed`);
