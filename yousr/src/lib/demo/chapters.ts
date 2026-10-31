import type { Locale } from "@/lib/i18n/config";

/**
 * The guided demo is one connected story told on the real screens.
 * Each step signs in as a persona and opens a route; copy lives under
 * demo.chapters.* and demo.steps.* in the message files.
 */
export interface DemoStep {
  id: string;
  persona: string;
  path: string;
  /** force a UI locale for this step (chapter 6 is Arabic) */
  locale?: Locale;
  /** an in-page interaction the viewer performs before moving on */
  inPage?: "import" | "request" | "revoke" | "review";
}

export interface DemoChapter {
  id: string;
  steps: DemoStep[];
}

export const DEMO_COOKIE = "masar_demo";
export const DEMO_LOCALE_COOKIE = "masar_demo_locale";

export const CHAPTERS: DemoChapter[] = [
  {
    id: "fatima",
    steps: [
      { id: "fatima_home", persona: "u_fatima", path: "/trajectory" },
      { id: "fatima_metabolic", persona: "u_fatima", path: "/trajectory/metabolic" },
    ],
  },
  {
    id: "mariam",
    steps: [
      { id: "mariam_home", persona: "u_mariam", path: "/trajectory" },
      { id: "mariam_cycle", persona: "u_mariam", path: "/trajectory/cycle" },
    ],
  },
  {
    id: "change",
    steps: [{ id: "mariam_import", persona: "u_mariam", path: "/trajectory/reserve", inPage: "import" }],
  },
  {
    id: "action",
    steps: [{ id: "mariam_request", persona: "u_mariam", path: "/actions", inPage: "request" }],
  },
  {
    id: "journey",
    steps: [
      { id: "layla_review", persona: "u_layla", path: "/clinician/patients/u_mariam", inPage: "review" },
      { id: "mariam_revoke", persona: "u_mariam", path: "/privacy", inPage: "revoke" },
      { id: "layla_blocked", persona: "u_layla", path: "/clinician/patients/u_mariam" },
    ],
  },
  {
    id: "arabic",
    steps: [{ id: "sara_ar", persona: "u_sara", path: "/trajectory", locale: "ar" }],
  },
];

export interface DemoPosition {
  chapter: number;
  step: number;
}

export function parsePosition(raw: string | undefined): DemoPosition | null {
  if (!raw) return null;
  const [c, s] = raw.split(".").map(Number);
  if (!Number.isInteger(c) || !Number.isInteger(s)) return null;
  if (!CHAPTERS[c] || !CHAPTERS[c].steps[s]) return null;
  return { chapter: c, step: s };
}

export function serializePosition(p: DemoPosition): string {
  return `${p.chapter}.${p.step}`;
}

export function stepAt(p: DemoPosition): DemoStep {
  return CHAPTERS[p.chapter].steps[p.step];
}

/** Next position, or null when the story is finished. */
export function nextPosition(p: DemoPosition): DemoPosition | null {
  const chapter = CHAPTERS[p.chapter];
  if (p.step + 1 < chapter.steps.length) return { chapter: p.chapter, step: p.step + 1 };
  if (p.chapter + 1 < CHAPTERS.length) return { chapter: p.chapter + 1, step: 0 };
  return null;
}

export function prevPosition(p: DemoPosition): DemoPosition | null {
  if (p.step > 0) return { chapter: p.chapter, step: p.step - 1 };
  if (p.chapter > 0) return { chapter: p.chapter - 1, step: CHAPTERS[p.chapter - 1].steps.length - 1 };
  return null;
}

/** Routes offered under "Explore screens individually" on the landing page. */
export const EXPLORE_ROUTES: { key: string; persona: string; path: string; locale?: Locale }[] = [
  { key: "fatimaTrajectory", persona: "u_fatima", path: "/trajectory" },
  { key: "mariamInsights", persona: "u_mariam", path: "/insights" },
  { key: "mariamImport", persona: "u_mariam", path: "/import" },
  { key: "mariamPrivacy", persona: "u_mariam", path: "/privacy" },
  { key: "mariamCycle", persona: "u_mariam", path: "/trajectory/cycle" },
  { key: "mariamActions", persona: "u_mariam", path: "/actions" },
  { key: "mariamLivingWell", persona: "u_mariam", path: "/living-well" },
  { key: "omarCouple", persona: "u_omar", path: "/couple" },
  { key: "laylaQueue", persona: "u_layla", path: "/clinician" },
  { key: "saraArabic", persona: "u_sara", path: "/trajectory", locale: "ar" },
  { key: "population", persona: "u_admin", path: "/population" },
  { key: "howItWorks", persona: "u_admin", path: "/about/how-it-works" },
];
