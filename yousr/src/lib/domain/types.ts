// Shared vocabulary for Masar. These are the only values allowed in the
// corresponding String columns in prisma/schema.prisma.

export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const ROLES = ["patient", "clinician", "admin", "cohort"] as const;
export type Role = (typeof ROLES)[number];

export const SEXES = ["female", "male"] as const;
export type Sex = (typeof SEXES)[number];

export const INTENTIONS = [
  "NotPlanning",
  "MaybeLater",
  "TryingNow",
  "Pregnant",
  "PreferNotToSay",
] as const;
export type Intention = (typeof INTENTIONS)[number];

export const DOMAINS = [
  "cycle",
  "reserve",
  "metabolic",
  "male",
  "conditions",
  "lifestyle",
] as const;
export type Domain = (typeof DOMAINS)[number];

export const DIRECTIONS = ["Improving", "Stable", "Shifting", "Discuss", "Unknown"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const CONFIDENCES = ["High", "Moderate", "Low", "InsufficientData"] as const;
export type Confidence = (typeof CONFIDENCES)[number];

export const MODIFIABILITY = ["Modifiable", "NonModifiable", "Unknown"] as const;
export type Modifiability = (typeof MODIFIABILITY)[number];

export const EVIDENCE_STRENGTHS = ["Strong", "Moderate", "Emerging"] as const;
export type EvidenceStrength = (typeof EVIDENCE_STRENGTHS)[number];

export const TIERS = ["Education", "DecisionSupport", "ClinicianOnly"] as const;
export type Tier = (typeof TIERS)[number];

export const ACTION_TYPES = [
  "Learn",
  "Optimise",
  "TestDiscuss",
  "Counsel",
  "PreserveDiscuss",
  "Refer",
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export const ACTION_STATES = [
  "Suggested",
  "Requested",
  "Confirmed",
  "Attended",
  "OutcomeRecorded",
  "Declined",
  "Expired",
] as const;
export type ActionState = (typeof ACTION_STATES)[number];

export const DATA_SOURCES = [
  "SelfReport",
  "MalaffiMock",
  "LabMock",
  "HealthAgeMock",
  "DeviceMock",
] as const;
export type DataSourceId = (typeof DATA_SOURCES)[number];

export const RECIPIENT_ROLES = ["Self", "Clinician", "Partner", "Analytics", "AiExplanation"] as const;
export type RecipientRole = (typeof RECIPIENT_ROLES)[number];

// There is deliberately no purpose for employment, insurance, marketing or
// unrelated apps. The purpose firewall is the absence of these values.
// AiExplanation is optional plain-language paraphrase (Gemini), not clinical advice.
export const PURPOSES = [
  "PersonalView",
  "ClinicianReview",
  "PartnerShare",
  "PopulationAnalytics",
  "AiExplanation",
] as const;
export type Purpose = (typeof PURPOSES)[number];

/** Resettable synthetic patient used by the judge journey onboarding. */
export const JOURNEY_USER_ID = "u_journey";

export const AUDIT_TYPES = [
  "View",
  "Share",
  "Export",
  "ConsentChange",
  "BlockedAccess",
  "Import",
  "ActionTransition",
  "Review",
] as const;
export type AuditType = (typeof AUDIT_TYPES)[number];

// Observation codes (unit in comment). Kept flat so rules stay readable.
export const OBS_CODES = {
  cycle_length: "days",
  cycle_regular: "text", // regular | irregular
  period_absent_days: "days",
  amh: "ng/mL",
  fsh: "IU/L",
  afc: "follicles",
  tsh: "mIU/L",
  bmi: "kg/m2",
  hba1c: "%",
  fasting_glucose: "mmol/L",
  bp_systolic: "mmHg",
  health_age: "years",
  semen_concentration: "M/mL",
  semen_motility: "%",
  semen_volume: "mL",
  sleep_hours: "hours",
  activity_minutes_week: "min/week",
  smoking: "text", // never | former | current
  alcohol_units_week: "units/week",
  stress_level: "1-10",
  laughter_days_week: "days/week",
  heat_exposure: "text", // low | high
} as const;
export type ObsCode = keyof typeof OBS_CODES;

export const CONDITION_CODES = [
  "pcos",
  "hypothyroidism",
  "hyperthyroidism",
  "endometriosis",
  "varicocele",
  "type2_diabetes",
  "prediabetes",
  "hypertension",
  "sti_history",
  "pelvic_surgery",
  "oncology_history",
] as const;
export type ConditionCode = (typeof CONDITION_CODES)[number];

export const FAMILY_HISTORY_CODES = [
  "early_menopause",
  "pcos_family",
  "diabetes_family",
  "genetic_condition",
  "male_infertility_family",
] as const;
export type FamilyHistoryCode = (typeof FAMILY_HISTORY_CODES)[number];

export interface Driver {
  factor: string; // i18n key under factors.*
  modifiability: Modifiability;
  evidenceId: string;
  strength: EvidenceStrength;
  valueLabel?: string; // e.g. "2.1 ng/mL"
  effectiveAt?: string; // ISO
  source?: DataSourceId;
  note?: string; // i18n key under driverNotes.*
}

export interface Unknown {
  missing: string; // i18n key under missing.*
  wouldNarrow: Domain;
  code?: ObsCode;
}

export interface DomainResult {
  domain: Domain;
  direction: Direction;
  confidence: Confidence;
  drivers: Driver[];
  unknowns: Unknown[];
  triggers: string[]; // escalation trigger ids
  tier: Tier;
  summaryKey: string; // i18n key under summaries.*
  observedKey: string; // i18n key under observed.*
}

export interface ObservationLite {
  code: ObsCode;
  valueNum: number | null;
  valueText: string | null;
  unit: string | null;
  effectiveAt: Date;
  dataSourceId: DataSourceId;
}

export interface ProfileLite {
  sex: Sex;
  birthYear: number;
  intention: Intention;
  conditions: ConditionCode[];
  familyHistory: FamilyHistoryCode[];
}

export function ageFromBirthYear(birthYear: number, now = new Date()): number {
  return now.getFullYear() - birthYear;
}

export function domainsFor(sex: Sex): Domain[] {
  return sex === "female"
    ? ["cycle", "reserve", "metabolic", "conditions", "lifestyle"]
    : ["male", "metabolic", "conditions", "lifestyle"];
}

export function parseJsonArray<T extends string>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed.filter((x) => typeof x === "string") as T[]) : [];
  } catch {
    return [];
  }
}
