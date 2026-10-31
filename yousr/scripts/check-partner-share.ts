// PartnerShare contract: directions-only payloads, never observations.
// Run: npx tsx scripts/check-partner-share.ts
import assert from "node:assert/strict";
import {
  assertPartnerShareSafe,
  toPartnerShareViews,
} from "../src/lib/couple/partner-view";
import { detectHandoff, needsClinicianHandoff } from "../src/lib/handoff/detect";
import { rejectsClinicalInvention } from "../src/lib/ai/reject";
import { assessDomain } from "../src/lib/engine/assess";
import type { DomainResult } from "../src/lib/domain/types";

let n = 0;
const check = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log(`ok  ${name}`);
};

check("toPartnerShareViews keeps only scoped domains", () => {
  const results = [
    { domain: "cycle", direction: "Shifting", confidence: "Moderate" },
    { domain: "metabolic", direction: "Stable", confidence: "High" },
  ] as Pick<DomainResult, "domain" | "direction" | "confidence">[];
  const views = toPartnerShareViews(results, ["cycle"]);
  assert.equal(views.length, 1);
  assert.equal(views[0].domain, "cycle");
  assertPartnerShareSafe(views);
});

check("assertPartnerShareSafe rejects observation leaks", () => {
  assert.throws(() =>
    assertPartnerShareSafe([
      { domain: "cycle", direction: "Stable", confidence: "High", observations: [{ code: "bmi" }] },
    ]),
  );
});

check("empty completed conditions are Unknown, not Stable", () => {
  const r = assessDomain(
    "conditions",
    {
      sex: "female",
      birthYear: 1992,
      intention: "MaybeLater",
      conditions: [],
      familyHistory: [],
      completedSteps: ["conditions"],
    },
    [],
    new Date("2026-10-30T00:00:00Z"),
  );
  assert.equal(r.direction, "Unknown");
  assert.notEqual(r.confidence, "High");
});

check("Ask Masar detects should-I and distress", () => {
  assert.equal(detectHandoff("Should I do IVF?"), "should_i");
  assert.ok(needsClinicianHandoff(detectHandoff("I want to kill myself")));
  assert.equal(needsClinicianHandoff(detectHandoff("What does changing mean?")), false);
});

check("Gemini rejector blocks score-like text", () => {
  assert.equal(rejectsClinicalInvention("Your fertility score is 72"), true);
  assert.equal(rejectsClinicalInvention("There is a 40% chance of pregnancy"), true);
  assert.equal(rejectsClinicalInvention("Cycles look more regular than before."), false);
});

console.log(`\n${n} checks passed`);
