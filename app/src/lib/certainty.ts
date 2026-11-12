/**
 * How sure Masar is about one statement. Every statement carries exactly one.
 *  fact      a value or event on record, with its source and date
 *  said      something the person told Masar
 *  trend     a comparison that passes Masar's published meaningful-change rule
 *  steady    a comparison within normal ups and downs
 *  evidence  what a cited guideline associates, at population level
 *  unknown   missing data, too few readings, or a limit of the measure itself
 */
export type Certainty = "fact" | "said" | "trend" | "steady" | "evidence" | "unknown";

export const CERTAINTIES: Certainty[] = ["fact", "said", "trend", "steady", "evidence", "unknown"];
