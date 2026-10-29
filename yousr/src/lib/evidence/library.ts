import raw from "../../../content/evidence/library.json";
import type { EvidenceStrength } from "@/lib/domain/types";

export interface EvidenceSource {
  id: string;
  title: string;
  organisation: string;
  year: number;
  strength: EvidenceStrength;
  url: string;
  summary: string;
  reviewedAt: string;
}

export const EVIDENCE: EvidenceSource[] = raw as EvidenceSource[];

const byId = new Map(EVIDENCE.map((e) => [e.id, e]));

export function getEvidence(id: string): EvidenceSource | undefined {
  return byId.get(id);
}
