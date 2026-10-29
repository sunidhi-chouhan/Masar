// Deterministic "how do these recorded items relate" rules. Each rule only
// fires when every area it names already has usable information. It never
// states cause and effect: the output is "these are relevant together for a
// clinical conversation".
import type { ConditionCode, Direction, Domain, DomainResult, Intention } from "@/lib/domain/types";

export type ConnectionKey =
  | "condition_cycle"
  | "metabolic_cycle"
  | "planning_timing"
  | "male_metabolic"
  | "reserve_context";

export interface Connection {
  key: ConnectionKey;
  /** the areas whose recorded information is being related */
  domains: Domain[];
}

const SIGNAL: Direction[] = ["Discuss", "Shifting"];
const CYCLE_CONDITIONS: ConditionCode[] = ["pcos", "endometriosis", "hypothyroidism", "hyperthyroidism"];

export function connectionsFor(
  profile: { conditions: ConditionCode[]; intention: Intention },
  results: DomainResult[],
): Connection[] {
  const usable = (d: Domain) => results.find((r) => r.domain === d && r.confidence !== "InsufficientData");
  const signal = (d: Domain) => {
    const r = usable(d);
    return r !== undefined && SIGNAL.includes(r.direction);
  };
  const out: Connection[] = [];

  const hasCycleCondition = profile.conditions.some((c) => CYCLE_CONDITIONS.includes(c));
  if (hasCycleCondition && usable("conditions") && signal("cycle")) {
    out.push({ key: "condition_cycle", domains: ["conditions", "cycle"] });
  }

  if (signal("metabolic") && (signal("cycle") || profile.conditions.includes("pcos"))) {
    out.push({
      key: "metabolic_cycle",
      domains: profile.conditions.includes("pcos") && usable("conditions") ? ["metabolic", "cycle", "conditions"] : ["metabolic", "cycle"],
    });
  }

  if (signal("male") && signal("metabolic")) {
    out.push({ key: "male_metabolic", domains: ["male", "metabolic"] });
  }

  const reserve = usable("reserve");
  if (reserve?.drivers.some((d) => d.factor === "amh") && (["cycle", "conditions", "metabolic"] as Domain[]).some((d) => signal(d))) {
    out.push({ key: "reserve_context", domains: ["reserve", "cycle", "conditions"].filter((d) => usable(d as Domain)) as Domain[] });
  }

  const planning = profile.intention === "TryingNow" || profile.intention === "MaybeLater" || profile.intention === "Pregnant";
  const flagged = (["conditions", "cycle", "reserve", "male", "metabolic"] as Domain[]).filter((d) => results.some((r) => r.domain === d && r.direction === "Discuss" && r.confidence !== "InsufficientData"));
  if (planning && flagged.length > 0) {
    out.push({ key: "planning_timing", domains: flagged });
  }

  return out;
}
