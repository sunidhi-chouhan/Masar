// Plain assertions over the pure trajectory/connection logic. No database.
// Run: npm run check:trajectory
import assert from "node:assert/strict";
import type { DomainResult, ObservationLite, ObsCode } from "../src/lib/domain/types";
import { domainFacts, measureRows } from "../src/lib/engine/trajectory";
import { connectionsFor } from "../src/lib/engine/connections";
import { assessDomain } from "../src/lib/engine/assess";

const NOW = new Date("2026-10-28T00:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const obs = (code: ObsCode, valueNum: number | null, ago: number, valueText: string | null = null): ObservationLite => ({
  code,
  valueNum,
  valueText,
  unit: valueNum === null ? null : "u",
  effectiveAt: daysAgo(ago),
  dataSourceId: "SelfReport",
});

let n = 0;
const check = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log(`ok  ${name}`);
};

check("a single reading is never compared", () => {
  const [row] = measureRows("metabolic", [obs("bmi", 28, 10)], NOW);
  assert.equal(row.previous, null);
  assert.equal(row.comparable, false);
  assert.equal(row.delta, null);
});

check("two readings under a week apart are not compared", () => {
  const [row] = measureRows("metabolic", [obs("bmi", 28, 10), obs("bmi", 29, 6)], NOW);
  assert.equal(row.comparable, false);
  assert.equal(row.delta, null);
  assert.equal(row.gapDays, 4);
});

check("two readings a month apart give an exact difference", () => {
  const [row] = measureRows("metabolic", [obs("bmi", 27.6, 240), obs("bmi", 28.9, 10)], NOW);
  assert.equal(row.comparable, true);
  assert.equal(row.delta, 1.3);
  assert.equal(row.gapDays, 230);
});

check("a text answer reports changed / unchanged only when comparable", () => {
  const [row] = measureRows(
    "cycle",
    [obs("cycle_regular", null, 120, "regular"), obs("cycle_regular", null, 5, "irregular")],
    NOW,
  );
  assert.equal(row.textChanged, true);
});

check("cycle lengths are split into the latest three and the three before", () => {
  const lengths = [28, 29, 30, 31, 41, 44, 47];
  const rows = measureRows("cycle", lengths.map((v, i) => obs("cycle_length", v, (lengths.length - i) * 30)), NOW);
  const row = rows.find((r) => r.code === "cycle_length");
  assert.deepEqual(row?.cycleSets?.recent, [41, 44, 47]);
  assert.deepEqual(row?.cycleSets?.earlier, [29, 30, 31]);
});

check("egg reserve with no laboratory reading reports no lab and no items", () => {
  const facts = domainFacts("reserve", [obs("sleep_hours", 7, 3)], { conditions: [], familyHistory: [] }, NOW);
  assert.equal(facts.hasLab, false);
  assert.equal(facts.items.length, 0);
  assert.equal(facts.total, 0);
});

check("an outdated reading is flagged as outdated", () => {
  const facts = domainFacts("reserve", [obs("amh", 1.4, 500)], { conditions: [], familyHistory: [] }, NOW);
  assert.equal(facts.hasLab, true);
  assert.equal(facts.items[0].outdated, true);
  assert.equal(facts.fresh, 0);
});

const result = (domain: DomainResult["domain"], direction: DomainResult["direction"], confidence: DomainResult["confidence"] = "Moderate"): DomainResult => ({
  domain,
  direction,
  confidence,
  drivers: [],
  unknowns: [],
  triggers: [],
  tier: "DecisionSupport",
  summaryKey: "x",
  observedKey: "x",
});

check("no flagged area gives no connection", () => {
  const out = connectionsFor(
    { conditions: ["pcos"], intention: "TryingNow" },
    [result("cycle", "Stable"), result("metabolic", "Stable"), result("conditions", "Stable")],
  );
  assert.deepEqual(out, []);
});

check("areas without usable information never create a connection", () => {
  const out = connectionsFor(
    { conditions: ["pcos"], intention: "TryingNow" },
    [result("cycle", "Discuss", "InsufficientData"), result("metabolic", "Shifting", "InsufficientData")],
  );
  assert.deepEqual(out, []);
});

check("a recorded condition plus a flagged cycle relates the two without a cause", () => {
  const out = connectionsFor(
    { conditions: ["pcos"], intention: "NotPlanning" },
    [result("cycle", "Discuss"), result("conditions", "Stable")],
  );
  assert.deepEqual(out.map((c) => c.key), ["condition_cycle"]);
});

check("planning plus a flagged area adds a timing connection", () => {
  const out = connectionsFor({ conditions: [], intention: "MaybeLater" }, [result("cycle", "Discuss")]);
  assert.deepEqual(out.map((c) => c.key), ["planning_timing"]);
});

check("one cycle date is not a trend", () => {
  const r = assessDomain(
    "cycle",
    { sex: "female", birthYear: 1998, intention: "NotPlanning", conditions: [], familyHistory: [], completedSteps: [] },
    [obs("cycle_length", 30, 40)],
    NOW,
  );
  assert.equal(r.direction, "Unknown");
  assert.equal(r.confidence, "InsufficientData");
  assert.equal(r.observedKey, "cycle_few");
});

console.log(`\n${n} checks passed`);
