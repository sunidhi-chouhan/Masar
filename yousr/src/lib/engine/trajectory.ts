// Pure helpers behind the dashboard trajectory and the area cards. Nothing
// here interprets a value: it only reports what was recorded, when, from
// where, and whether two readings can honestly be compared.
import type { DataSourceId, Domain, ObsCode, ObservationLite } from "@/lib/domain/types";
import { DOMAIN_CODES } from "./breakdown";
import { STALENESS_MONTHS } from "./rules";

/** Observation code -> i18n key under factors.* */
export const CODE_FACTOR: Record<string, string> = {
  cycle_length: "cycle_length",
  cycle_regular: "cycle_regular",
  period_absent_days: "period_absent_days",
  amh: "amh",
  afc: "afc",
  fsh: "fsh",
  tsh: "thyroid",
  bmi: "weight_trend",
  hba1c: "glycaemic",
  fasting_glucose: "fasting_glucose",
  bp_systolic: "blood_pressure",
  health_age: "health_age",
  semen_concentration: "semen_concentration",
  semen_motility: "semen_motility",
  semen_volume: "semen_volume",
  sleep_hours: "sleep",
  activity_minutes_week: "activity",
  smoking: "smoking",
  alcohol_units_week: "alcohol",
  stress_level: "stress",
  laughter_days_week: "laughter",
  heat_exposure: "heat",
};

/** Months after which a reading of this kind no longer counts as current. */
export function stalenessFor(code: ObsCode): number {
  if (code === "cycle_length" || code === "cycle_regular" || code === "period_absent_days") return STALENESS_MONTHS.cycle;
  if (
    code === "sleep_hours" ||
    code === "activity_minutes_week" ||
    code === "smoking" ||
    code === "alcohol_units_week" ||
    code === "stress_level" ||
    code === "laughter_days_week" ||
    code === "heat_exposure"
  )
    return STALENESS_MONTHS.checkin;
  return STALENESS_MONTHS.lab;
}

const DAY_MS = 86_400_000;
const MONTH_MS = 30.44 * DAY_MS;
/** Two readings closer than this are never presented as a comparison. */
export const MIN_COMPARISON_GAP_DAYS = 7;

export interface Pt {
  value: number | null;
  text: string | null;
  unit: string | null;
  at: string;
  source: DataSourceId;
  outdated: boolean;
}

function toPt(o: ObservationLite, now: Date): Pt {
  return {
    value: o.valueNum,
    text: o.valueText,
    unit: o.unit,
    at: o.effectiveAt.toISOString(),
    source: o.dataSourceId,
    outdated: (now.getTime() - o.effectiveAt.getTime()) / MONTH_MS > stalenessFor(o.code),
  };
}

function hasValue(o: ObservationLite): boolean {
  return o.valueNum !== null || o.valueText !== null;
}

function byDate(a: ObservationLite, b: ObservationLite): number {
  return a.effectiveAt.getTime() - b.effectiveAt.getTime();
}

export interface MeasureRow {
  code: ObsCode;
  /** i18n key under factors.* */
  factor: string;
  count: number;
  latest: Pt;
  previous: Pt | null;
  /** two readings of the same measure at least a week apart */
  comparable: boolean;
  gapDays: number | null;
  /** latest minus previous, numeric measures only */
  delta: number | null;
  /** latest text differs from previous, text measures only */
  textChanged: boolean | null;
  /** cycle lengths only: the three most recent against the three before them */
  cycleSets: { recent: number[]; earlier: number[] } | null;
}

/** One row per measure recorded in this area, with an honest previous/latest pair. */
export function measureRows(domain: Domain, obs: ObservationLite[], now: Date): MeasureRow[] {
  const rows: MeasureRow[] = [];
  for (const code of DOMAIN_CODES[domain]) {
    const s = obs.filter((o) => o.code === code && hasValue(o)).sort(byDate);
    if (!s.length) continue;
    const latestO = s[s.length - 1];
    const prevO = s.length > 1 ? s[s.length - 2] : null;
    const gapDays = prevO ? Math.round((latestO.effectiveAt.getTime() - prevO.effectiveAt.getTime()) / DAY_MS) : null;
    const comparable = prevO !== null && gapDays !== null && gapDays >= MIN_COMPARISON_GAP_DAYS;
    const numeric = latestO.valueNum !== null && prevO?.valueNum !== null && prevO?.valueNum !== undefined;
    rows.push({
      code,
      factor: CODE_FACTOR[code] ?? code,
      count: s.length,
      latest: toPt(latestO, now),
      previous: prevO ? toPt(prevO, now) : null,
      comparable,
      gapDays,
      delta: comparable && numeric ? Math.round(((latestO.valueNum as number) - (prevO!.valueNum as number)) * 100) / 100 : null,
      textChanged: comparable && latestO.valueText !== null && prevO?.valueText != null ? latestO.valueText !== prevO.valueText : null,
      cycleSets:
        code === "cycle_length"
          ? {
              recent: s.slice(-3).map((o) => o.valueNum as number),
              earlier: s.slice(-6, -3).map((o) => o.valueNum as number),
            }
          : null,
    });
  }
  return rows;
}

export interface FactItem {
  code: string;
  /** i18n key under factors.* */
  factor: string;
  value: number | null;
  text: string | null;
  unit: string | null;
  at: string | null;
  source: DataSourceId | null;
  outdated: boolean;
}

export interface DomainFacts {
  items: FactItem[];
  /** readings (or recorded profile items) in this area */
  total: number;
  /** of those, how many are still within their freshness window */
  fresh: number;
  /** a laboratory-type reserve reading exists (AMH, AFC or FSH) */
  hasLab: boolean;
}

/** What is actually recorded for an area, newest first, for the overview cards. */
export function domainFacts(
  domain: Domain,
  obs: ObservationLite[],
  profile: { conditions: string[]; familyHistory: string[] },
  now: Date,
): DomainFacts {
  const hasLab = obs.some((o) => (o.code === "amh" || o.code === "afc" || o.code === "fsh") && hasValue(o));
  const rows = obs.filter((o) => DOMAIN_CODES[domain].includes(o.code) && hasValue(o)).sort(byDate);
  const items: FactItem[] = [];

  if (domain === "conditions") {
    for (const c of profile.conditions) {
      items.push({ code: c, factor: c, value: null, text: null, unit: null, at: null, source: null, outdated: false });
    }
    for (const f of profile.familyHistory) {
      items.push({ code: f, factor: `family_${f}`, value: null, text: null, unit: null, at: null, source: null, outdated: false });
    }
  }

  for (const code of DOMAIN_CODES[domain]) {
    const s = rows.filter((o) => o.code === code);
    if (!s.length) continue;
    const take = code === "cycle_length" ? s.slice(-3).reverse() : [s[s.length - 1]];
    for (const o of take) {
      const p = toPt(o, now);
      items.push({
        code,
        factor: CODE_FACTOR[code] ?? code,
        value: p.value,
        text: p.text,
        unit: p.unit,
        at: p.at,
        source: p.source,
        outdated: p.outdated,
      });
    }
  }

  const dated = domain === "cycle" ? rows.filter((o) => o.code === "cycle_length") : rows;
  const profileCount = domain === "conditions" ? profile.conditions.length + profile.familyHistory.length : 0;
  return {
    items,
    total: dated.length + profileCount,
    fresh: dated.filter((o) => !toPt(o, now).outdated).length + profileCount,
    hasLab,
  };
}
