// Every resident-facing string added by the longitudinal layer must have
// Arabic. Strings are taken from tr("...") calls and label/text fields in the
// new components, and from the text fields and labels of the new libraries.
import { readFileSync } from "node:fs";
import { t } from "../src/lib/i18n";

const UI = ["trajectory.tsx", "scenes.tsx", "live.tsx", "prepare-guide.tsx", "assistant.tsx", "clinician-trajectory.tsx", "system-pathways.tsx"].map((f) => `src/components/prototype/${f}`);
const LIB = ["src/lib/longitudinal.ts", "src/lib/pathways.ts"];
const EXTRA_UI = ["src/components/prototype/controls.tsx", "src/components/prototype/patient.tsx", "src/components/prototype/dashboard.tsx",  "src/components/prototype/clinician.tsx", "src/components/prototype/system.tsx"];

const found = new Set<string>();
const grab = (src: string, re: RegExp) => {
  for (const m of src.matchAll(re)) found.add(m[1].replace(/\\"/g, '"'));
};
for (const f of [...UI, ...EXTRA_UI]) {
  const src = readFileSync(f, "utf8");
  grab(src, /\btr\("((?:[^"\\]|\\.)+)"/g);
  // audit-log entries and notices, which the patient reads in their language
  grab(src, /\b(?:what|text): (?:\w+ \? )?"((?:[^"\\]|\\.)+)"/g);
  grab(src, /\bwhat: \w+ \? "(?:[^"\\]|\\.)+" : "((?:[^"\\]|\\.)+)"/g);
  if (UI.includes(f)) grab(src, /\b(?:label|text): "((?:[^"\\]|\\.)+)"/g);
  // tr({ key: "Text", … }[k]) maps and Record<…, string> constants in components
  for (const m of src.matchAll(/tr\(\{([^}]*)\}\[/g)) grab(m[1], /: "((?:[^"\\]|\\.)+)"/g);
  if (UI.includes(f)) for (const block of src.matchAll(/(?:export )?const [A-Z_]+: Record<[^>]+> = \{([\s\S]*?)\n\};/g)) grab(block[1], /: "((?:[^"\\]|\\.)+)",?$/gm);
}
for (const f of LIB) {
  const src = readFileSync(f, "utf8").split("export function aiContext")[0];
  grab(src, /\b(?:text|label|note|citation|strength|level): "((?:[^"\\]|\\.)+)"/g);
  grab(src, /\btext: \w+ \? "((?:[^"\\]|\\.)+)"/g);
  grab(src, /: "((?:[^"\\]|\\.)+)" : "(?:[^"\\]|\\.)+"/g);
  grab(src, /: "(?:[^"\\]|\\.)+" : "((?:[^"\\]|\\.)+)"/g);
  // Record<…, string> constants: KEY: "Value",
  for (const block of src.matchAll(/export const [A-Z_]+(?::[^=]+)? = \{([\s\S]*?)\n\};/g)) grab(block[1], /^\s*[\w"]+: "((?:[^"\\]|\\.)+)",?$/gm);
}
// patient.tsx tracking texts
for (const m of readFileSync("src/components/prototype/patient.tsx", "utf8").matchAll(/(?:label|involves|does): "((?:[^"\\]|\\.)+)"/g)) found.add(m[1]);

const skip = (s: string) => /^(bg|text|border|fill|stroke)-/.test(s) || !/[A-Za-z]{2}/.test(s) || /^[a-z][A-Za-z_]*$/.test(s) || /^(UP|M\/mL|ng\/mL|bpm|h|%|steps)$/.test(s);
const missing = [...found].filter((s) => !skip(s) && t("ar", s) === s);
if (missing.length) {
  console.log(missing.map((m) => JSON.stringify(m)).join("\n"));
  console.error(`\n${missing.length} strings without Arabic`);
  process.exit(1);
}
console.log(`i18n: ${found.size} longitudinal strings, all with Arabic`);
