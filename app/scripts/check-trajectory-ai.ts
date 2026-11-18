// The longitudinal assistant's safeguards: what may come back from Gemini,
// and what never reaches it.
import assert from "node:assert/strict";
import { HEROES } from "../src/lib/population";
import { aiContext, journeyView } from "../src/lib/longitudinal";
import { prototypeAsk, validAnswer } from "../src/server/ai/trajectory-ai";

const noura = HEROES.find((h) => h.id === "noura")!;
const ALL = { cycles: true, lifestyle: true, device: true, labs: true, clinical: true };
const v = journeyView(noura, ALL, { stage: 4, wearableGap: false, extraObs: false, extraLab: false, labs: "available", clinical: "available" });
const ctx = aiContext(noura, v, { goal: "Maybe in a few years", insightTitles: [], ageBand: "30–34" });
const ids = new Set([...v.obs.map((o) => o.id), ...v.changes.map((c) => c.id)]);
const say = (l: { text: string; vars?: Record<string, string | number> }) => Object.entries(l.vars ?? {}).reduce((t, [k, x]) => t.split(`{${k}}`).join(String(x)), l.text);
const good = {
  observation: "Your last 4 recorded cycles ranged from 25 to 37 days.",
  context: "Based on the cycles you logged and your wearable.",
  evidence: ["FIGO normal limits of menstruation (2018)"],
  uncertainty: "This cannot tell whether you ovulate.",
  options: ["Keep logging when your period starts."],
  preparation: ["Ask whether the change is worth looking into."],
  pathway: "Your family doctor is a good first step.",
  references: ["cycle_variation"],
};
let n = 0;
const ok = async (name: string, f: () => void | Promise<void>) => { await f(); n++; console.log(`  ✓ ${name}`); };

(async () => {
  await ok("a grounded answer passes", () => assert.ok(validAnswer(good, ctx, ids)));
  await ok("an invented number fails", () => assert.equal(validAnswer({ ...good, observation: "Your cycles averaged 41 days." }, ctx, ids), null));
  await ok("an invented reference fails", () => assert.equal(validAnswer({ ...good, references: ["lab_999"] }, ctx, ids), null));
  await ok("a diagnosis fails", () => assert.equal(validAnswer({ ...good, observation: "This means you have PCOS." }, ctx, ids), null));
  await ok("a fertility label fails", () => assert.equal(validAnswer({ ...good, uncertainty: "You are infertile." }, ctx, ids), null));
  await ok("a pregnancy chance fails", () => assert.equal(validAnswer({ ...good, options: ["Your chance of pregnancy is 30% this year."] }, ctx, ids), null));
  await ok("a missing pathway fails", () => assert.equal(validAnswer({ ...good, pathway: "" }, ctx, ids), null));
  await ok("without permission nothing is sent: Masar answers", async () => {
    const r = await prototypeAsk({ allowed: false, question: "What has changed?", intent: "changes", resident: noura, view: v, goal: null, insightTitles: [], ageBand: "30–34", lang: "en", say });
    assert.equal(r.source, "masar");
    assert.ok(r.answer.observation.includes("cycles"));
  });
  await ok("urgent messages get fixed text and never reach the model", async () => {
    const r = await prototypeAsk({ allowed: true, question: "I have severe pain and heavy bleeding", intent: "changes", resident: noura, view: v, goal: null, insightTitles: [], ageBand: "30–34", lang: "en", say });
    assert.equal(r.source, "urgent");
  });
  await ok("withheld categories are named, never their contents", () => {
    const w = journeyView(noura, { ...ALL, labs: false, device: false }, { stage: 4, wearableGap: false, extraObs: false, extraLab: false, labs: "available", clinical: "available" });
    const c = aiContext(noura, w, { goal: null, insightTitles: [], ageBand: "30–34" });
    assert.ok(!/AMH|Lab \[|ng\/mL/.test(c));
    assert.ok(c.includes("Laboratory results") && c.includes("Wearable data"));
  });
  console.log(`trajectory AI: ${n} checks passed`);
})();
