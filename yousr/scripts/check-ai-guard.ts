// Plain assertions over the checks every AI-written explanation must pass.
// No model is called. Run: npm run check:ai
import assert from "node:assert/strict";
import { checkExplanation, numbersIn } from "../src/lib/ai/guard";

const FACTS_EN = [
  "Locale: en",
  "Area: Egg reserve context",
  "Direction (rule output): Changing",
  "Confidence (rule output): A few readings",
  "What was recorded: AMH 2.4 ng/mL, then 1.3 ng/mL two years later.",
  "Why it may matter: A noticeable fall between results is worth understanding in context with a clinician.",
  "What this cannot tell you: AMH and age cannot measure egg quality or predict natural conception.",
].join("\n");

const FACTS_AR = [
  "Locale: ar",
  "Area: صحة الدورة",
  "What this cannot tell you: أنماط الدورة وحدها لا تؤكد الإباضة أو جودة البويضات أو احتمال الحمل، ولا تثبت تشخيصًا طبيًا.",
].join("\n");

let n = 0;
const check = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log(`ok  ${name}`);
};

check("a faithful explanation passes", () => {
  const text =
    "Your AMH went from 2.4 to 1.3 over two years. That fall is worth talking through with a clinician. It cannot tell you about egg quality or whether you will conceive naturally.";
  assert.deepEqual(checkExplanation(text, FACTS_EN), { ok: true });
});

check("a number that is not in the facts is rejected", () => {
  assert.deepEqual(checkExplanation("You have a 40% lower reserve than others your age.", FACTS_EN), {
    ok: false,
    reason: "new_number",
  });
});

check("fertility labels and scores are rejected", () => {
  for (const text of ["This suggests you may be infertile.", "Your fertility score is moderate.", "قد تكونين عقيمة."]) {
    assert.deepEqual(checkExplanation(text, FACTS_EN), { ok: false, reason: "banned_wording" });
  }
});

check("a banned phrase is allowed when the approved facts already use it", () => {
  const text = "أنماط الدورة وحدها لا تخبرك عن احتمال الحمل.";
  assert.deepEqual(checkExplanation(text, FACTS_AR), { ok: true });
});

check("Arabic-Indic digits match the same numbers in the facts", () => {
  assert.deepEqual(checkExplanation("انخفض AMH من ٢٫٤ إلى ١٫٣ خلال عامين.", FACTS_EN), { ok: true });
  assert.deepEqual([...numbersIn("٢٫٤ and 2,4 and 2.40")], ["2.4"]);
});

check("empty and overly long replies are rejected", () => {
  assert.deepEqual(checkExplanation("   ", FACTS_EN), { ok: false, reason: "empty" });
  assert.deepEqual(checkExplanation("word ".repeat(300), FACTS_EN), { ok: false, reason: "too_long" });
});

console.log(`\n${n} checks passed`);
