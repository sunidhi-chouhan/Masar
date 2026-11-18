// Checks for the longitudinal layer: consent filtering, the demo clock,
// change detection and the absence of scores or labels.
import assert from "node:assert/strict";
import { HEROES } from "../src/lib/population";
import { changesForClinician, journeyView, NO_EDITS, STAGES, aiContext, masarAnswer, guideDraft, type JourneyConsent, type JourneySim } from "../src/lib/longitudinal";

const noura = HEROES.find((h) => h.id === "noura")!;
const arjun = HEROES.find((h) => h.id === "arjun")!;
const ALL: JourneyConsent = { cycles: true, lifestyle: true, device: true, labs: true, clinical: true };
const NONE: JourneyConsent = { cycles: false, lifestyle: false, device: false, labs: false, clinical: false };
const sim = (stage: 0 | 1 | 2 | 3 | 4, x: Partial<JourneySim> = {}): JourneySim => ({ stage, wearableGap: false, extraObs: false, extraLab: false, labs: "available", clinical: "available", ...x });
const say = (l: { text: string; vars?: Record<string, string | number> }) => Object.entries(l.vars ?? {}).reduce((t, [k, v]) => t.split(`{${k}}`).join(String(v)), l.text);

let n = 0;
const ok = (name: string, f: () => void) => { f(); n++; console.log(`  ✓ ${name}`); };

ok("baseline has few cycles and says what it can't assess", () => {
  const v = journeyView(noura, ALL, sim(0));
  assert.ok(v.cycles.length <= 2);
  assert.equal(v.changes.filter((c) => c.kind !== "data").length, 0);
  assert.ok(v.baseline.cannot.length >= 2);
});
ok("nothing is used without permission", () => {
  const v = journeyView(noura, NONE, sim(4));
  assert.equal(v.obs.length, 0);
  assert.equal(v.changes.length, 0);
  assert.ok(v.lanes.every((l) => !l.allowed && l.withheld > 0));
  const ctx = aiContext(noura, v, { goal: null, insightTitles: [], ageBand: "30–34" });
  assert.ok(!/Cycle lengths|Lab \[/.test(ctx), "context must not carry withheld data");
});
ok("month 12 detects cycle variation, sleep shift and new AMH", () => {
  const v = journeyView(noura, ALL, sim(4));
  const ids = v.changes.map((c) => c.id);
  assert.ok(ids.includes("cycle_variation"), ids.join());
  assert.ok(ids.includes("sleep_shift"), ids.join());
  assert.ok(ids.includes("new_lab"), ids.join());
  for (const c of v.changes) assert.ok(c.cannot.length && c.next.length && c.evidence.citation, c.id);
});
ok("revoking wearable removes sleep change and wearable context", () => {
  const v = journeyView(noura, { ...ALL, device: false }, sim(4));
  assert.ok(!v.changes.some((c) => c.id === "sleep_shift"));
  assert.ok(!v.obs.some((o) => o.scope === "device"));
});
ok("revoking cycles removes cycle data from the AI context", () => {
  const v = journeyView(noura, { ...ALL, cycles: false }, sim(4));
  const ctx = aiContext(noura, v, { goal: null, insightTitles: [], ageBand: "30–34" });
  assert.ok(!ctx.includes("Cycle lengths"));
  assert.ok(ctx.includes("Cycle tracking"), "withheld categories are named only");
});
ok("simulated wearable gap is shown as missing data", () => {
  const v = journeyView(noura, ALL, sim(4, { wearableGap: true }));
  assert.ok(v.changes.some((c) => c.id === "gap_device"));
});
ok("edits and removals of own observations change detection", () => {
  const v = journeyView(noura, ALL, sim(4));
  const last = v.obs.filter((o) => o.type === "cycle_start").slice(-4).map((o) => o.id);
  const w = journeyView(noura, ALL, sim(4), { ...NO_EDITS, hidden: last });
  assert.ok(w.cycles.length < v.cycles.length);
});
ok("man's journey has no cycle lane data and still works", () => {
  const v = journeyView(arjun, ALL, sim(4));
  assert.equal(v.cycles.length, 0);
  assert.ok(v.changes.some((c) => c.id === "sleep_shift"));
});
ok("no scores, labels or predictions in any generated text", () => {
  const bad = /\b(fertility score|infertile|fertile\b|high fertility risk|low fertility|reproductively (un)?healthy|chance of pregnancy is|\d+\s*%\s*chance)/i;
  for (const st of STAGES) {
    const v = journeyView(noura, ALL, sim(st.id));
    const g = guideDraft("female", v, { goal: "Maybe in a few years", insightTitles: [], ruleQuestions: [], conditions: [] });
    const text = [...v.changes.flatMap((c) => [c.title, c.what, ...c.relevant, ...c.cannot, ...c.next]), ...g.questions, ...g.discussion, ...g.why].map(say).join("\n");
    assert.ok(!bad.test(text), text.match(bad)?.[0]);
    for (const i of ["changes", "missing", "lab", "prepare", "track", "cannot"] as const) {
      const a = masarAnswer(i, v, say, { goal: null, insightTitles: [] });
      assert.ok(a.pathway && a.observation, i);
      assert.ok(!bad.test(JSON.stringify(a)), JSON.stringify(a).match(bad)?.[0]);
    }
  }
});
ok("a clinician sees a change only when its data is shared too", () => {
  const v = journeyView(noura, ALL, sim(4));
  assert.deepEqual(changesForClinician(v.changes, ["goals", "cycles"]), [], "nothing without Changes");
  const ids = changesForClinician(v.changes, ["changes", "cycles", "labs"]).map((c) => c.id);
  assert.ok(ids.includes("cycle_variation") && ids.includes("new_lab"));
  assert.ok(!ids.includes("sleep_shift") && !ids.includes("stress_shift"), ids.join());
});
console.log(`longitudinal: ${n} checks passed`);
