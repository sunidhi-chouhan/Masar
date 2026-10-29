import {
  ageFromBirthYear,
  type ActionType,
  type Domain,
  type DomainResult,
  type ProfileLite,
} from "@/lib/domain/types";
import { TRIGGERS } from "@/lib/engine/rules";

export interface SuggestedAction {
  type: ActionType;
  domain: Domain;
  titleKey: string; // actions.titles.*
  reasonKey: string; // actions.reasons.*
  triggerCode?: string;
  /** lower = shown first */
  rank: number;
}

const TYPE_RANK: Record<ActionType, number> = {
  Refer: 0,
  Counsel: 1,
  PreserveDiscuss: 2,
  TestDiscuss: 3,
  Optimise: 4,
  Learn: 5,
};

/**
 * Deterministic mapping from domain results + intention to neutral options.
 * Never recommends one option over another; ordering reflects urgency of a
 * *conversation*, not a medical ranking.
 */
export function routeActions(profile: ProfileLite, results: DomainResult[]): SuggestedAction[] {
  const out: SuggestedAction[] = [];
  const age = ageFromBirthYear(profile.birthYear);
  const push = (a: Omit<SuggestedAction, "rank">) =>
    out.push({ ...a, rank: TYPE_RANK[a.type] });

  for (const r of results) {
    for (const trig of r.triggers) {
      switch (trig) {
        case TRIGGERS.T1_cycle_persistent:
          push({ type: "Counsel", domain: "cycle", titleKey: "counsel_cycle", reasonKey: "t1_cycle", triggerCode: trig });
          push({ type: "TestDiscuss", domain: "cycle", titleKey: "test_thyroid", reasonKey: "t1_thyroid", triggerCode: trig });
          break;
        case TRIGGERS.T1b_amenorrhoea:
          push({ type: "Counsel", domain: "cycle", titleKey: "counsel_cycle", reasonKey: "t1b", triggerCode: trig });
          break;
        case TRIGGERS.T2_condition_intention:
          push({ type: "Counsel", domain: r.domain, titleKey: "counsel_preconception", reasonKey: "t2", triggerCode: trig });
          break;
        case TRIGGERS.T3_age35_no_reserve:
          push({ type: "PreserveDiscuss", domain: "reserve", titleKey: "preserve_discuss", reasonKey: "t3", triggerCode: trig });
          break;
        case TRIGGERS.T4_semen_below_reference:
          push({ type: "Refer", domain: "male", titleKey: "refer_andrology", reasonKey: "t4", triggerCode: trig });
          break;
        case TRIGGERS.T4b_male_metabolic_smoking:
          push({ type: "TestDiscuss", domain: "male", titleKey: "test_semen", reasonKey: "t4b", triggerCode: trig });
          push({ type: "Optimise", domain: "lifestyle", titleKey: "optimise_smoking", reasonKey: "t4b_smoking", triggerCode: trig });
          break;
        case TRIGGERS.T5_family_history:
          push({ type: "Counsel", domain: r.domain, titleKey: "counsel_family", reasonKey: "t5", triggerCode: trig });
          break;
        case TRIGGERS.T6_pregnant_concern:
          push({ type: "Refer", domain: "conditions", titleKey: "refer_antenatal", reasonKey: "t6", triggerCode: trig });
          break;
        case TRIGGERS.T7_distress:
          push({ type: "Counsel", domain: "lifestyle", titleKey: "counsel_support", reasonKey: "t7", triggerCode: trig });
          break;
        case TRIGGERS.TR_amh_low:
          push({ type: "Counsel", domain: "reserve", titleKey: "counsel_reserve", reasonKey: "tr", triggerCode: trig });
          break;
        case TRIGGERS.TM_hba1c:
        case TRIGGERS.TM_bmi:
          push({ type: "TestDiscuss", domain: "metabolic", titleKey: "test_metabolic", reasonKey: "tm", triggerCode: trig });
          break;
      }
    }

    // Learning is offered wherever something is moving or being discussed.
    if (r.direction === "Shifting" || r.direction === "Discuss") {
      push({ type: "Learn", domain: r.domain, titleKey: `learn_${r.domain}`, reasonKey: `learn_${r.direction.toLowerCase()}` });
    }

    // Optimise is only offered for modifiable drivers that are off-target.
    for (const d of r.drivers) {
      if (d.modifiability !== "Modifiable" || !d.valueLabel) continue;
      const num = parseFloat(d.valueLabel);
      if (d.factor === "smoking" && d.valueLabel === "current") {
        push({ type: "Optimise", domain: "lifestyle", titleKey: "optimise_smoking", reasonKey: "opt_smoking" });
      } else if (d.factor === "sleep" && !Number.isNaN(num) && num < 7) {
        push({ type: "Optimise", domain: "lifestyle", titleKey: "optimise_sleep", reasonKey: "opt_sleep" });
      } else if (d.factor === "activity" && !Number.isNaN(num) && num < 150) {
        push({ type: "Optimise", domain: "lifestyle", titleKey: "optimise_activity", reasonKey: "opt_activity" });
      } else if (d.factor === "stress" && !Number.isNaN(num) && num >= 6) {
        push({ type: "Optimise", domain: "lifestyle", titleKey: "optimise_stress", reasonKey: "opt_stress" });
      } else if (d.factor === "laughter" && !Number.isNaN(num) && num < 3) {
        push({ type: "Optimise", domain: "lifestyle", titleKey: "optimise_laughter", reasonKey: "opt_laughter" });
      }
    }
  }

  // Intention-level options
  if (profile.intention === "TryingNow") {
    push({ type: "Counsel", domain: "conditions", titleKey: "counsel_preconception", reasonKey: "intent_trying" });
  }
  if (profile.intention === "Pregnant") {
    push({ type: "Learn", domain: "lifestyle", titleKey: "learn_pregnancy_stress", reasonKey: "intent_pregnant" });
  }
  if (profile.intention === "MaybeLater" && age >= 35 && profile.sex === "female") {
    push({ type: "Learn", domain: "reserve", titleKey: "learn_life_stages", reasonKey: "intent_maybe_35" });
  }

  // Deduplicate by type+domain+title, keep lowest rank.
  const seen = new Map<string, SuggestedAction>();
  for (const a of out) {
    const key = `${a.type}:${a.domain}:${a.titleKey}`;
    const existing = seen.get(key);
    if (!existing || a.rank < existing.rank) seen.set(key, a);
  }
  return [...seen.values()].sort((a, b) => a.rank - b.rank);
}
