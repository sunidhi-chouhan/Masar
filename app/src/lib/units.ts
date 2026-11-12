import type { ReadingCode } from "./model";

// Converts a value read from a lab report into the unit Masar keeps for that
// measure. Done here, in code, rather than by the model, so the value and the
// lab's printed reference range are always converted the same way. A unit
// that isn't recognised is never guessed at: the value is kept as printed and
// doesn't join the measure's trend.

/** The unit Masar keeps each measure in. */
export const MASAR_UNIT: Partial<Record<ReadingCode, string>> = {
  amh: "ng/mL",
  semen_concentration: "M/mL",
  tsh: "mIU/L",
  hba1c: "%",
  bmi: "kg/m²",
};

const clean = (unit: string) =>
  unit
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[µμ]/g, "u")
    .replace(/²/g, "2")
    .replace(/\^/g, "")
    .replace(/×/g, "x");

type Convert = (x: number) => number;
const same: Convert = (x) => x;

/** Recognised printed units for each measure, and how to convert them. */
const KNOWN: Partial<Record<ReadingCode, [RegExp, Convert][]>> = {
  amh: [
    [/^ng\/ml$/, same],
    [/^pmol\/l$/, (x) => x / 7.14],
  ],
  semen_concentration: [[/^(m|mill|million|millions|x?106|10\*6)\/ml$/, same]],
  tsh: [[/^(miu\/l|uiu\/ml|mu\/l|uu\/ml)$/, same]],
  hba1c: [
    [/^%$/, same],
    [/^mmol\/mol$/, (x) => x / 10.929 + 2.15],
  ],
  bmi: [[/^kg\/m2$/, same]],
};

const round = (x: number) => Math.round(x * 100) / 100;

export interface Converted {
  value: number;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
}

/** null when the code or the printed unit isn't one Masar recognises. */
export function toMasarUnit(code: ReadingCode, value: number, unit: string, refLow: number | null, refHigh: number | null): Converted | null {
  const target = MASAR_UNIT[code];
  const rule = KNOWN[code]?.find(([re]) => re.test(clean(unit)));
  if (!target || !rule) return null;
  const f = rule[1];
  const ref = (x: number | null) => (x === null || !Number.isFinite(x) ? null : round(f(x)));
  return { value: round(f(value)), unit: target, refLow: ref(refLow), refHigh: ref(refHigh) };
}
