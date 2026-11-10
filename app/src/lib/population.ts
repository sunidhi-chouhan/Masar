// The synthetic population: three named characters from the story plus 10,000
// generated residents with an illustrative Abu Dhabi-like mix. None of it is
// real; the mix is a plausible shape for a demo, not a statistic.

import type { Condition, Group, Intention, Language, Reading, Resident, SourceId, Touchpoint } from "./model";
import { between, chance, intBetween, logNormal, normal, pick, rng, round, weighted, type Rng } from "./random";

/** The demo's "today", fixed so every run shows the same dates. */
export const TODAY = new Date("2026-11-02T08:00:00Z");

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => iso(new Date(TODAY.getTime() - n * 86_400_000));

function cycles(values: number[], source: SourceId = "device"): Reading[] {
  return values.map((value, i) => ({ code: "cycle_length", value, unit: "days", at: daysAgo((values.length - i) * 30), source }));
}

export const HEROES: Resident[] = [
  {
    id: "noura",
    name: "Noura Al Mansouri",
    sex: "female",
    age: 34,
    group: "Emirati",
    language: "ar",
    intention: "MaybeLater",
    conditions: [],
    familyEarlyMenopause: true,
    smoker: false,
    readings: [
      { code: "amh", value: 2.4, unit: "ng/mL", at: "2024-09-15", source: "lab" },
      { code: "amh", value: 1.3, unit: "ng/mL", at: "2026-09-30", source: "lab" },
      ...cycles([28, 29, 28, 30, 29, 28]),
      { code: "bmi", value: 23.0, unit: "kg/m²", at: "2025-10-14", source: "healthAge" },
      { code: "bmi", value: 22.8, unit: "kg/m²", at: "2026-10-21", source: "healthAge" },
      { code: "sleep_hours", value: 7.4, unit: "hours", at: daysAgo(3), source: "device" },
    ],
    touchpoint: { kind: "HealthAge", at: "2026-10-21" },
    optedIn: true,
    hero: true,
  },
  {
    id: "arjun",
    name: "Arjun Nair",
    sex: "male",
    age: 37,
    group: "SouthAsian",
    language: "en",
    intention: "TryingSoon",
    conditions: [],
    familyEarlyMenopause: false,
    smoker: true,
    readings: [
      { code: "bmi", value: 29.6, unit: "kg/m²", at: "2025-10-02", source: "healthAge" },
      { code: "bmi", value: 31.4, unit: "kg/m²", at: "2026-10-18", source: "healthAge" },
      { code: "sleep_hours", value: 6.1, unit: "hours", at: daysAgo(4), source: "device" },
    ],
    touchpoint: { kind: "HealthAge", at: "2026-10-18" },
    optedIn: true,
    hero: true,
  },
  {
    id: "maryam",
    name: "Maryam Haddad",
    sex: "female",
    age: 29,
    group: "OtherArab",
    language: "ar",
    intention: "NotPlanning",
    conditions: [],
    familyEarlyMenopause: false,
    smoker: false,
    readings: [
      ...cycles([29, 30, 28, 31, 29, 30]),
      { code: "bmi", value: 21.9, unit: "kg/m²", at: "2026-10-25", source: "healthAge" },
    ],
    touchpoint: { kind: "GPVisit", at: "2026-10-25" },
    optedIn: true,
    hero: true,
  },
];

const FIRST: Record<Group, { female: string[]; male: string[] }> = {
  Emirati: { female: ["Aisha", "Fatima", "Mariam", "Hessa", "Shamma", "Latifa"], male: ["Ahmed", "Khalid", "Saeed", "Rashid", "Hamdan", "Omar"] },
  OtherArab: { female: ["Lina", "Rania", "Dina", "Salma", "Nour", "Hala"], male: ["Karim", "Yousef", "Tariq", "Sami", "Fadi", "Bilal"] },
  SouthAsian: { female: ["Priya", "Ayesha", "Anjali", "Sana", "Divya", "Fatima"], male: ["Rahul", "Imran", "Vikram", "Asif", "Suresh", "Faisal"] },
  Filipino: { female: ["Maria", "Joy", "Angelica", "Kristine"], male: ["Jose", "Mark", "John Paul", "Rommel"] },
  Western: { female: ["Emma", "Sophie", "Laura", "Anna"], male: ["James", "Lucas", "Daniel", "Thomas"] },
  Other: { female: ["Amina", "Elena", "Zainab", "Grace"], male: ["Musa", "Ivan", "Chen", "Samuel"] },
};
const INITIALS = "ABCDEFGHIJKLMNOPRSTWY";

const GROUP_WEIGHTS: Record<Group, number> = { Emirati: 20, OtherArab: 17, SouthAsian: 33, Filipino: 8, Western: 7, Other: 15 };

function languageFor(r: Rng, g: Group): Language {
  switch (g) {
    case "Emirati":
    case "OtherArab":
      return chance(r, 0.85) ? "ar" : "en";
    case "SouthAsian":
      return weighted(r, { en: 50, ur: 25, hi: 25 });
    case "Filipino":
      return chance(r, 0.6) ? "tl" : "en";
    default:
      return "en";
  }
}

function intentionFor(r: Rng, age: number): Intention {
  if (age < 25) return weighted(r, { NotPlanning: 55, MaybeLater: 35, TryingSoon: 4, TryingNow: 2, PreferNotToSay: 4 });
  if (age < 33) return weighted(r, { NotPlanning: 20, MaybeLater: 40, TryingSoon: 18, TryingNow: 15, PreferNotToSay: 7 });
  return weighted(r, { NotPlanning: 30, MaybeLater: 30, TryingSoon: 15, TryingNow: 15, PreferNotToSay: 10 });
}

function generate(index: number, r: Rng): Resident {
  const group = weighted(r, GROUP_WEIGHTS);
  const sex = chance(r, 0.5) ? "female" : "male";
  const age = intBetween(r, 18, 45);
  const intention = intentionFor(r, age);
  const conditions: Condition[] = [];
  const readings: Reading[] = [];
  const touchAt = daysAgo(intBetween(r, 5, 330));

  if (sex === "female") {
    if (chance(r, 0.1)) conditions.push("pcos");
    if (chance(r, 0.05)) conditions.push("endometriosis");
  }
  if (chance(r, sex === "female" ? 0.05 : 0.02)) conditions.push("hypothyroid");
  if (chance(r, 0.03 + Math.max(0, age - 30) * 0.004)) conditions.push("diabetes");
  if (chance(r, 0.004)) conditions.push("cancer_new");

  const bmi = round(Math.max(17, normal(r, 26, 4.5)), 1);
  readings.push({ code: "bmi", value: bmi, unit: "kg/m²", at: touchAt, source: "healthAge" });
  if (chance(r, 0.6)) {
    readings.push({ code: "bmi", value: round(bmi - normal(r, 0.3, 1), 1), unit: "kg/m²", at: daysAgo(intBetween(r, 360, 700)), source: "healthAge" });
  }

  if (sex === "female") {
    if (chance(r, 0.4)) {
      const irregular = conditions.includes("pcos") ? 0.7 : 0.08;
      const values = Array.from({ length: 6 }, () =>
        Math.round(chance(r, irregular) ? between(r, 36, 55) : normal(r, 29, 2.2)),
      );
      readings.push(...cycles(values));
    }
    if (chance(r, 0.2)) {
      const base = Math.max(0.2, logNormal(r, Math.max(0.6, 4.5 - 0.12 * (age - 25)), 0.35));
      const first = daysAgo(intBetween(r, 400, 900));
      readings.push({ code: "amh", value: round(base, 1), unit: "ng/mL", at: first, source: "lab" });
      if (chance(r, 0.5)) {
        const next = Math.max(0.1, base * (1 + normal(r, -0.12, 0.18)));
        readings.push({ code: "amh", value: round(next, 1), unit: "ng/mL", at: daysAgo(intBetween(r, 20, 200)), source: "lab" });
      }
    }
  } else if (chance(r, 0.1)) {
    readings.push({ code: "semen_concentration", value: round(logNormal(r, 42, 0.7), 0), unit: "M/mL", at: daysAgo(intBetween(r, 30, 500)), source: "lab" });
  }

  if (chance(r, 0.3)) {
    const value = conditions.includes("diabetes") ? normal(r, 7.1, 0.7) : normal(r, 5.4, 0.3);
    readings.push({ code: "hba1c", value: round(value, 1), unit: "%", at: touchAt, source: "lab" });
  }

  const touch: Touchpoint = conditions.length && chance(r, 0.4) ? "NewDiagnosis" : age < 33 && chance(r, 0.15) ? "Premarital" : weighted(r, { HealthAge: 60, GPVisit: 40 });
  const first = pick(r, FIRST[group][sex]);
  return {
    id: `R${String(index).padStart(5, "0")}`,
    name: `${first} ${INITIALS[Math.floor(r() * INITIALS.length)]}.`,
    sex,
    age,
    group,
    language: languageFor(r, group),
    intention,
    conditions,
    familyEarlyMenopause: sex === "female" && chance(r, 0.06),
    smoker: chance(r, sex === "male" ? 0.2 : 0.05),
    readings,
    touchpoint: { kind: conditions.includes("cancer_new") ? "NewDiagnosis" : touch, at: touchAt },
    optedIn: chance(r, 0.72),
  };
}

export const POPULATION_SIZE = 10_000;

let cached: Resident[] | null = null;

/** Heroes first, then the generated residents. Built once per server process. */
export function population(): Resident[] {
  if (!cached) {
    const r = rng(2026);
    cached = [...HEROES, ...Array.from({ length: POPULATION_SIZE }, (_, i) => generate(i + 1, r))];
  }
  return cached;
}

export function resident(id: string): Resident | undefined {
  return population().find((p) => p.id === id);
}
