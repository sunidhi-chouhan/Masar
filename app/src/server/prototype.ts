import "server-only";
import { GROUP_LABEL, LANGUAGE_LABEL, type Resident } from "@/lib/model";
import { HEROES, population } from "@/lib/population";
import { ALL_SOURCES, signalsFor, topUrgency, visibleRecord } from "@/lib/signals";
import { report, type Report } from "@/lib/evidence";

// Data for the /prototype, computed once on the server from the existing
// synthetic population. No new synthetic people are invented: the profiles
// are the three demo residents plus one generated resident whose existing
// record shows relevant medical history.

export interface ProtoProfile {
  id: string;
  resident: Resident;
  /** what this profile demonstrates, for the Demo Controls */
  story: "labs" | "lifestyle" | "limited" | "history";
}

let profiles: ProtoProfile[] | null = null;

export function prototypeProfiles(): ProtoProfile[] {
  if (profiles) return profiles;
  const hero = (id: string) => HEROES.find((h) => h.id === id)!;
  // A generated woman with PCOS on record, recorded irregular cycles and near-term plans.
  const history = population().find(
    (p) =>
      !p.hero &&
      p.sex === "female" &&
      p.conditions.includes("pcos") &&
      (p.intention === "TryingSoon" || p.intention === "TryingNow") &&
      p.readings.filter((r) => r.code === "cycle_length").length >= 6 &&
      p.age >= 26 &&
      p.age <= 36,
  );
  profiles = [
    { id: "noura", resident: hero("noura"), story: "labs" },
    { id: "arjun", resident: hero("arjun"), story: "lifestyle" },
    { id: "maryam", resident: hero("maryam"), story: "limited" },
    ...(history ? [{ id: history.id, resident: history, story: "history" as const }] : []),
  ];
  return profiles;
}

/** Synthetic residents who shared with Dr Layla and have something worth a conversation, for the clinician's list. */
export function prototypeInbox(): Resident[] {
  const ids = new Set(prototypeProfiles().map((p) => p.id));
  const out: Resident[] = [];
  const byCode = new Map<string, number>();
  for (const p of population()) {
    if (p.hero || ids.has(p.id) || !p.optedIn) continue;
    const s = signalsFor(visibleRecord(p, ALL_SOURCES));
    if (!s.length || !topUrgency(s)) continue;
    const key = s[0].code;
    if ((byCode.get(key) ?? 0) >= 2) continue; // a varied morning, not one rule repeated
    byCode.set(key, (byCode.get(key) ?? 0) + 1);
    out.push(p);
    if (out.length >= 14) break;
  }
  return out;
}

export function prototypeReport(): Report {
  return report({ group: (g) => GROUP_LABEL[g], language: (l) => LANGUAGE_LABEL[l] });
}
