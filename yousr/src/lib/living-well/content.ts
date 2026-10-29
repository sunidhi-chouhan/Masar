import raw from "../../../content/living-well/hubs.json";
import type { Domain, EvidenceStrength, Locale } from "@/lib/domain/types";

export interface LivingWellCard {
  id: string;
  title: string;
  titleAr: string;
  claim: string;
  claimAr: string;
  cannot: string;
  cannotAr: string;
  evidenceId: string;
  strength: EvidenceStrength;
  askClinician: string;
  askClinicianAr: string;
}

export interface LivingWellHub {
  id: string;
  title: string;
  titleAr: string;
  intro: string;
  introAr: string;
  domains: Domain[];
  cards: LivingWellCard[];
}

export const HUBS: LivingWellHub[] = raw as LivingWellHub[];

export function getHub(id: string): LivingWellHub | undefined {
  return HUBS.find((h) => h.id === id);
}

export function hubsForDomain(domain: Domain): LivingWellHub[] {
  return HUBS.filter((h) => h.domains.includes(domain));
}

const STRENGTH_ORDER: Record<EvidenceStrength, number> = { Strong: 0, Moderate: 1, Emerging: 2 };

export function cardsByStrength(hub: LivingWellHub): LivingWellCard[] {
  return [...hub.cards].sort((a, b) => STRENGTH_ORDER[a.strength] - STRENGTH_ORDER[b.strength]);
}

export function pick(obj: object, key: string, locale: Locale): string {
  const rec = obj as Record<string, unknown>;
  const ar = rec[`${key}Ar`];
  const en = rec[key];
  return (locale === "ar" && typeof ar === "string" && ar) || (typeof en === "string" ? en : "");
}
