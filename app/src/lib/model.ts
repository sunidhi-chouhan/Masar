// Shared types for Masar. Everything here describes synthetic people only.

export type Sex = "female" | "male";

export type Intention = "NotPlanning" | "MaybeLater" | "TryingSoon" | "TryingNow" | "PreferNotToSay";

export const INTENTION_LABEL: Record<Intention, string> = {
  NotPlanning: "Not planning a pregnancy",
  MaybeLater: "Maybe in a few years",
  TryingSoon: "Planning to try within a year",
  TryingNow: "Trying now",
  PreferNotToSay: "Prefers not to say",
};

/** Broad nationality groups, used only for equity reporting in aggregate. */
export type Group = "Emirati" | "OtherArab" | "SouthAsian" | "Filipino" | "Western" | "Other";

export const GROUP_LABEL: Record<Group, string> = {
  Emirati: "Emirati",
  OtherArab: "Other Arab",
  SouthAsian: "South Asian",
  Filipino: "Filipino",
  Western: "Western",
  Other: "Other",
};

export type Language = "ar" | "en" | "ur" | "hi" | "tl";

export const LANGUAGE_LABEL: Record<Language, string> = {
  ar: "Arabic",
  en: "English",
  ur: "Urdu",
  hi: "Hindi",
  tl: "Tagalog",
};

export type Condition = "pcos" | "hypothyroid" | "endometriosis" | "diabetes" | "cancer_new";

export const CONDITION_LABEL: Record<Condition, string> = {
  pcos: "Polycystic ovary syndrome (PCOS)",
  hypothyroid: "Underactive thyroid",
  endometriosis: "Endometriosis",
  diabetes: "Diabetes",
  cancer_new: "New cancer diagnosis, treatment not started",
};

/** Where a reading came from. Each source is consented to separately. */
export type SourceId = "self" | "malaffi" | "lab" | "healthAge" | "device";

export const SOURCES: { id: SourceId; label: string; detail: string }[] = [
  { id: "self", label: "What you tell us", detail: "Plans, family history, how you feel" },
  { id: "malaffi", label: "Clinic records (Malaffi)", detail: "Diagnoses and visits across Abu Dhabi clinics" },
  { id: "lab", label: "Lab results", detail: "Hormone tests such as AMH, HbA1c, thyroid, semen analysis" },
  { id: "healthAge", label: "Health Age check", detail: "Weight, blood pressure and lifestyle from your check" },
  { id: "device", label: "Phone and wearable", detail: "Cycle dates and sleep" },
];

export type ReadingCode = "amh" | "cycle_length" | "bmi" | "hba1c" | "tsh" | "semen_concentration" | "sleep_hours";

export interface Reading {
  code: ReadingCode;
  value: number;
  unit: string;
  /** ISO date */
  at: string;
  source: SourceId;
}

export type Touchpoint = "HealthAge" | "Premarital" | "NewDiagnosis" | "GPVisit";

export const TOUCHPOINT_LABEL: Record<Touchpoint, string> = {
  HealthAge: "Health Age check",
  Premarital: "Premarital screening",
  NewDiagnosis: "New diagnosis",
  GPVisit: "Routine GP visit",
};

export interface Resident {
  id: string;
  name: string;
  sex: Sex;
  age: number;
  group: Group;
  language: Language;
  intention: Intention;
  conditions: Condition[];
  /** recorded from what the person told a clinician (self-report source) */
  familyEarlyMenopause: boolean;
  smoker: boolean;
  readings: Reading[];
  touchpoint: { kind: Touchpoint; at: string };
  /** agreed to let Masar look for signals */
  optedIn: boolean;
  /** a named demo character rather than one of the generated population */
  hero?: boolean;
}

/** The kinds of next step Masar can offer. Masar never prescribes. */
export type OptionKind = "Learn" | "Optimise" | "TestDiscuss" | "Counsel" | "PreserveDiscuss" | "Refer";

export type Urgency = "routine" | "soon" | "urgent";
