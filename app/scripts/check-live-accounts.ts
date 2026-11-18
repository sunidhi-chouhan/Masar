// Every signed-in demo account runs the latest resident experience on its own
// stored record: its own resident, its own permissions (with the tracking
// defaults), its own longitudinal state, and nothing from another account.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.MASAR_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "masar-live-"));

(async () => {
const { PERSON_IDS } = await import("../src/lib/accounts");
const { updatePerson, person, trackingConsent } = await import("../src/server/store");
const { liveView, liveState } = await import("../src/server/experience");
const { parseJourney, parseGuide } = await import("../src/lib/journey-input");

let n = 0;
const ok = (name: string, f: () => void) => {
  f();
  n++;
  console.log(`  ✓ ${name}`);
};

ok("each account builds from its own resident and starts at month 12", () => {
  for (const id of PERSON_IDS) {
    const v = liveView(id);
    assert.equal(v.resident.id, id);
    assert.equal(liveState(id, "en").journey.stage, 4);
    assert.equal(liveState(id, "en").profileId, id);
  }
});
ok("nothing is shared before the person chooses", () => {
  for (const id of PERSON_IDS) assert.equal(liveView(id).jv.obs.length, 0, id);
});
ok("tracking permissions default to the existing ones, until chosen", () => {
  updatePerson("noura", (p) => ({ ...p, sources: { ...p.sources, device: true, self: false } }));
  assert.deepEqual(trackingConsent(person("noura")), { cycles: true, lifestyle: false });
  updatePerson("noura", (p) => ({ ...p, longitudinal: { ...p.longitudinal, cycles: false } }));
  assert.equal(trackingConsent(person("noura")).cycles, false);
});
ok("one account's entries and guide never appear in another's", () => {
  updatePerson("arjun", (p) => ({ ...p, sources: { ...p.sources, self: true }, longitudinal: { ...p.longitudinal, journey: parseJourney({ stage: 4, edits: { entries: [{ id: "u-1", type: "stress", value: "high", at: "2026-11-02" }] } }), guide: parseGuide({ intro: "x", questions: ["q"], sharedAt: "2026-11-02T00:00:00Z", sharedKeys: ["questions"] }) } }));
  assert.ok(liveView("arjun").jv.obs.some((o) => o.id === "u-1"));
  for (const id of PERSON_IDS.filter((x) => x !== "arjun")) {
    assert.ok(!liveView(id).jv.obs.some((o) => o.id === "u-1"), id);
    assert.equal(person(id).longitudinal.guide, null, id);
  }
});
ok("stored state is validated: unknown types, bad ids and dates are dropped", () => {
  const j = parseJourney({ stage: 9, edits: { entries: [{ id: "../x", type: "stress", value: "high", at: "2026-11-02" }, { id: "ok", type: "lab", value: 1, at: "2026-11-02" }, { id: "ok2", type: "sleep_self", value: 99, at: "2026-11-02" }] } }, 4);
  assert.equal(j.stage, 4);
  assert.equal(j.edits.entries.length, 0);
});
console.log(`live accounts: ${n} checks passed`);
})();
