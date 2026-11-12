import type { SourceId } from "./model";

// What each permission means, in the person's words: used by the journey's
// permissions step and by My data, so both say exactly the same thing.

export type ConsentKey = SourceId | "share" | "assistant" | "reading";

export interface ConsentItem {
  key: ConsentKey;
  on: boolean;
  /** none: never switched on; granted: on now; revoked: was on, now off */
  status: "none" | "granted" | "revoked";
}

export const PERMISSION_TEXT: Record<ConsentKey, { label: string; involves: string; why: string; does: string; never: string; who: string }> = {
  self: {
    label: "Your answers",
    involves: "Your About you and Quick check answers from this journey.",
    why: "Only you know some of this, and it shapes what is worth discussing.",
    does: "Uses your answers with Masar's published rules, and shows them back to you.",
    never: "Never treats an answer as a diagnosis, and never shares it with employers or insurers.",
    who: "Stays with Masar. Your doctor sees it only if you allow sharing below.",
  },
  device: {
    label: "Phone and wearable",
    involves: "Cycle dates and sleep from your phone or wearable.",
    why: "Cycle dates over time are what let Masar describe whether your cycles are changing.",
    does: "Compares recent cycles with earlier ones, using a published rule.",
    never: "Cycle patterns alone never confirm ovulation or a diagnosis.",
    who: "Stays with Masar unless you allow sharing below.",
  },
  malaffi: {
    label: "Clinic records (Malaffi)",
    involves: "Diagnoses from your clinic visits across Abu Dhabi.",
    why: "Some conditions are best planned around before a pregnancy.",
    does: "Looks only for diagnoses relevant to reproductive health.",
    never: "Never reads anything unrelated to reproductive health. In this pilot, records are synthetic.",
    who: "Stays with Masar unless you allow sharing below.",
  },
  lab: {
    label: "Laboratory results",
    involves: "Results such as AMH, blood sugar, thyroid and semen analysis, including reports you upload.",
    why: "Results over time can show a real change, or that things are steady.",
    does: "Calls a change real only when it passes Masar's published rule.",
    never: "One result is never called a trend. In this pilot, results are synthetic.",
    who: "Stays with Masar unless you allow sharing below.",
  },
  healthAge: {
    label: "Previous health assessments",
    involves: "Weight and smoking from your Health Age check.",
    why: "They are things you can change, and they can matter for reproductive health.",
    does: "Shows them as things you can change, never as a judgement.",
    never: "Never used to score or rank you.",
    who: "Stays with Masar unless you allow sharing below.",
  },
  share: {
    label: "Your family doctor",
    involves: "Your summary and your requests, from the sources you switched on.",
    why: "So Dr Layla Al Hashimi can review it and arrange a conversation if you ask.",
    does: "Lets her see your summary; every time she opens it is logged for you to see.",
    never: "Never visible to employers or insurers. No setting exists that would allow it.",
    who: "Shared with one clinician only: Dr Layla Al Hashimi.",
  },
  assistant: {
    label: "Let the assistant read my summary",
    involves: "Your answers and what Masar found, from the sources you switched on.",
    why: "To choose two final questions around what you've shared, and to write a short summary of your picture.",
    does: "Explains and summarises. Masar's own rules still decide every finding.",
    never: "Never diagnoses, never gives a fertility score or a chance of pregnancy. When off, Masar writes these itself.",
    who: "Processed by Google Gemini, an external AI provider. Withdrawing deletes the summary it wrote.",
  },
  reading: {
    label: "Let the assistant read reports I upload",
    involves: "Lab reports your doctor asks you to upload.",
    why: "To suggest the values for you to check, so you don't have to type them.",
    does: "Suggests values; nothing counts until you confirm it.",
    never: "Never reads a report unless Laboratory results is also on. When off, your doctor reads the file.",
    who: "Processed by Google Gemini, an external AI provider.",
  },
};

