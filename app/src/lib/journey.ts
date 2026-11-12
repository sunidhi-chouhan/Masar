// The onboarding journey's question model. Pure and deterministic.
//
// The journey asks richer, better-explained questions than before, but Masar's
// signal rules are unchanged: every answer that a rule reads is mapped onto the
// exact keys and values the rules already use (see toRuleAnswers). Everything
// else is context: shown back to the person, summarised, never turned into a
// finding. No thresholds, no scores, no new clinical rules live here.

import type { Intention, Sex } from "./model";
import type { Answers } from "./profile";

export type JAnswer = string | string[];
export type JAnswers = Record<string, JAnswer>;

export type ChapterId = "goals" | "history" | "life" | "help";

export interface JOption {
  value: string;
  label: string;
  /** chosen alone: clears the other choices in a multi-select */
  exclusive?: boolean;
}

export interface JQuestion {
  id: string;
  chapter: ChapterId;
  text: string;
  /** why Masar asks, in one short sentence */
  why: string;
  options: JOption[];
  multi?: boolean;
  /** sensitive: shown with an extra reassurance, always skippable */
  sensitive?: boolean;
  /** only for one sex, where bodies differ */
  sex?: Sex;
  /** shown only when earlier answers make it relevant */
  when?: (a: JAnswers) => boolean;
  /** a short note shown after a particular answer */
  note?: { when: string[]; text: string };
}

export const CHAPTERS: { id: ChapterId; title: string; body: string }[] = [
  { id: "goals", title: "Your reproductive goals", body: "What matters to you, and when." },
  { id: "history", title: "Your reproductive history", body: "Experiences that can help explain what changes over time." },
  { id: "life", title: "Your health and daily life", body: "Only what is relevant to reproductive health." },
  { id: "help", title: "What would you like help with?", body: "So your path focuses on what is useful to you." },
];

const is = (a: JAnswers, id: string, ...values: string[]) => {
  const v = a[id];
  return Array.isArray(v) ? v.some((x) => values.includes(x)) : typeof v === "string" && values.includes(v);
};
const planningSoon = (a: JAnswers) => is(a, "goal", "now", "soon");

const PREFER = { value: "prefer", label: "Prefer not to say" };

export const QUESTIONS: JQuestion[] = [
  // ---------- A. Goals ----------
  {
    id: "goal",
    chapter: "goals",
    text: "What best describes your current reproductive plans?",
    why: "Plans shape which options are worth discussing, and when. Nothing here is shared unless you allow it.",
    options: [
      { value: "now", label: "Trying to conceive now" },
      { value: "soon", label: "Planning to conceive in the next 1–2 years" },
      { value: "future", label: "Considering pregnancy in the future" },
      { value: "preserve", label: "Exploring fertility preservation" },
      { value: "not", label: "Not planning pregnancy currently" },
      PREFER,
    ],
  },
  {
    id: "concern",
    chapter: "goals",
    text: "Is there a particular reproductive-health concern you want to understand?",
    why: "So Masar can put what matters to you first.",
    options: [
      { value: "overall", label: "Understanding my reproductive health" },
      { value: "cycle", label: "Changes in my menstrual cycle" },
      { value: "results", label: "Understanding my existing test results" },
      { value: "family", label: "Family history of reproductive conditions" },
      { value: "planning", label: "Planning for future pregnancy" },
      { value: "consult", label: "Preparing for a healthcare consultation" },
      { value: "other", label: "Something else" },
    ],
  },
  {
    id: "partnerContext",
    chapter: "goals",
    text: "Would you like to include a partner's reproductive-health context?",
    why: "Reproductive health often involves two people. Masar never assumes a relationship.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "na", label: "Not applicable" },
      PREFER,
    ],
    note: {
      when: ["yes"],
      text: "A partner's information belongs to them. Masar won't ask you about them here; they can share their own context with their own consent.",
    },
  },

  // ---------- B. History (women) ----------
  {
    id: "cycleChange",
    chapter: "history",
    sex: "female",
    text: "Have you experienced changes in your menstrual cycle?",
    why: "Cycles that change or become irregular are worth a routine check. A pattern on its own doesn't confirm anything.",
    options: [
      { value: "none", label: "No noticeable changes" },
      { value: "irregular", label: "Irregular periods" },
      { value: "missed", label: "Missed periods" },
      { value: "length", label: "Significant changes in cycle length" },
      { value: "absent", label: "No periods for several months" },
      { value: "na", label: "Not applicable" },
      { value: "unsure", label: "Unsure" },
    ],
  },
  {
    id: "cycleSince",
    chapter: "history",
    sex: "female",
    when: (a) => is(a, "cycleChange", "irregular", "missed", "length", "absent"),
    text: "How long has this been happening?",
    why: "How long a change has lasted helps your doctor understand it. It isn't used to calculate anything.",
    options: [
      { value: "lt3", label: "Less than 3 months" },
      { value: "3to12", label: "3 to 12 months" },
      { value: "gt12", label: "More than a year" },
      { value: "unsure", label: "Unsure" },
    ],
  },
  {
    id: "periodPain",
    chapter: "history",
    sex: "female",
    when: (a) => !is(a, "cycleChange", "na", "absent"),
    text: "Are your periods very painful or very heavy?",
    why: "Very painful or heavy periods are worth checking; some causes are easier to manage when found early.",
    options: [
      { value: "none", label: "No" },
      { value: "pain", label: "Very painful" },
      { value: "heavy", label: "Very heavy" },
      { value: "both", label: "Both" },
    ],
  },
  {
    id: "diagnoses",
    chapter: "history",
    sex: "female",
    multi: true,
    text: "Have you ever been diagnosed with any reproductive or hormonal conditions?",
    why: "Some conditions are best managed before a pregnancy. Having one doesn't mean you will have difficulty conceiving.",
    options: [
      { value: "pcos", label: "PCOS" },
      { value: "endometriosis", label: "Endometriosis" },
      { value: "thyroid", label: "Thyroid condition" },
      { value: "poi", label: "Premature or early ovarian insufficiency" },
      { value: "other", label: "Other relevant condition" },
      { value: "none", label: "None", exclusive: true },
      { value: "unsure", label: "Unsure", exclusive: true },
    ],
  },
  {
    id: "thyroidKind",
    chapter: "history",
    when: (a) => is(a, "diagnoses", "thyroid"),
    text: "Which kind of thyroid condition?",
    why: "An underactive thyroid is worth planning around before a pregnancy.",
    options: [
      { value: "under", label: "Underactive (hypothyroidism)" },
      { value: "over", label: "Overactive (hyperthyroidism)" },
      { value: "unsure", label: "Unsure" },
    ],
  },
  {
    id: "investigations",
    chapter: "history",
    sex: "female",
    multi: true,
    text: "Have you previously had any reproductive-health investigations?",
    why: "Helps Masar see what's already known, and what might still be worth discussing.",
    options: [
      { value: "hormone", label: "Hormone testing" },
      { value: "ultrasound", label: "Ultrasound" },
      { value: "reserve", label: "Ovarian reserve testing" },
      { value: "assessment", label: "Fertility assessment" },
      { value: "none", label: "None", exclusive: true },
      { value: "unsure", label: "Unsure", exclusive: true },
    ],
  },

  // ---------- B. History (men) ----------
  {
    id: "steroids",
    chapter: "history",
    sex: "male",
    text: "Have you used testosterone or bodybuilding steroids?",
    why: "They can switch off the body's own sperm production, often for months. Recovery is common after stopping.",
    options: [
      { value: "never", label: "Never" },
      { value: "past", label: "In the past" },
      { value: "now", label: "Yes, currently" },
      PREFER,
    ],
  },
  {
    id: "maleHistory",
    chapter: "history",
    sex: "male",
    multi: true,
    text: "Have you ever had any of these?",
    why: "Some past problems can affect sperm. Many men with this history have no fertility problems at all.",
    options: [
      { value: "undescended", label: "A testicle that hadn't dropped as a child" },
      { value: "mumps", label: "Mumps as a teenager or adult" },
      { value: "injury", label: "An injury or operation down there" },
      { value: "none", label: "None of these", exclusive: true },
    ],
  },
  {
    id: "investigationsM",
    chapter: "history",
    sex: "male",
    multi: true,
    text: "Have you previously had any reproductive-health investigations?",
    why: "Helps Masar see what's already known, and what might still be worth discussing.",
    options: [
      { value: "semen", label: "Semen analysis" },
      { value: "hormone", label: "Hormone testing" },
      { value: "assessment", label: "Fertility assessment" },
      { value: "none", label: "None", exclusive: true },
      { value: "unsure", label: "Unsure", exclusive: true },
    ],
  },

  // ---------- B. History (everyone) ----------
  {
    id: "treatment",
    chapter: "history",
    sensitive: true,
    text: "Have you previously received fertility treatment?",
    why: "Previous care helps your doctor continue from where things are. You don't have to answer.",
    options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, PREFER],
  },
  {
    id: "treatmentNow",
    chapter: "history",
    sensitive: true,
    when: (a) => is(a, "treatment", "yes"),
    text: "Is that treatment ongoing?",
    why: "So Masar doesn't suggest discussions you're already having.",
    options: [{ value: "ongoing", label: "Yes, ongoing" }, { value: "finished", label: "No, it has finished" }, PREFER],
  },
  {
    id: "pregnantBefore",
    chapter: "history",
    sex: "female",
    sensitive: true,
    when: planningSoon,
    text: "Have you been pregnant before?",
    why: "Asked only because you are planning a pregnancy. Context for your doctor; it doesn't raise any finding.",
    options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "skip", label: "Prefer not to say" }],
  },
  {
    id: "fatheredBefore",
    chapter: "history",
    sex: "male",
    sensitive: true,
    when: planningSoon,
    text: "Have you fathered a pregnancy before?",
    why: "Asked only because you are planning a pregnancy. Context for your doctor; it doesn't raise any finding.",
    options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "skip", label: "Prefer not to say" }],
  },
  {
    id: "familyHistory",
    chapter: "history",
    sex: "female",
    text: "Is there a family history of early menopause or reproductive-health conditions?",
    why: "Early menopause in a mother or sister can make timing worth discussing earlier. It doesn't decide your own timing.",
    options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "unsure", label: "Unsure" }, PREFER],
  },
  {
    id: "familyWhich",
    chapter: "history",
    sex: "female",
    multi: true,
    when: (a) => is(a, "familyHistory", "yes"),
    text: "What kind of family history?",
    why: "Only menopause before 45 in a mother or sister is something Masar's published rules look at.",
    options: [
      { value: "menopause", label: "My mother or a sister went through menopause before 45" },
      { value: "other", label: "Another reproductive-health condition" },
      { value: "unsure", label: "Unsure", exclusive: true },
    ],
  },
  {
    id: "medicalTreatment",
    chapter: "history",
    sensitive: true,
    text: "Have you had any medical treatment or surgery you've been told may affect reproductive health?",
    why: "Some treatments can affect fertility, and options to preserve it are best discussed early.",
    options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "unsure", label: "Unsure" }, PREFER],
  },
  {
    id: "medicalTreatmentWhen",
    chapter: "history",
    sensitive: true,
    when: (a) => is(a, "medicalTreatment", "yes"),
    text: "Has that treatment started yet?",
    why: "Fertility preservation is best discussed before treatment starts.",
    options: [
      { value: "planned", label: "Not yet, it's planned" },
      { value: "underway", label: "It's under way" },
      { value: "done", label: "It has finished" },
      PREFER,
    ],
    note: { when: ["planned"], text: "If treatment hasn't started, it's worth asking your care team about fertility preservation now." },
  },

  // ---------- C. Health and daily life ----------
  {
    id: "smoking",
    chapter: "life",
    text: "Do you currently smoke or use tobacco, including shisha or vaping?",
    why: "Smoking affects eggs and sperm, and stopping helps. Support is available.",
    options: [
      { value: "never", label: "Never" },
      { value: "past", label: "Previously, but not now" },
      { value: "sometimes", label: "Occasionally" },
      { value: "regular", label: "Regularly" },
      PREFER,
    ],
  },
  {
    id: "sleep",
    chapter: "life",
    text: "How would you describe your usual sleep?",
    why: "Everyday context you can change. It doesn't raise any finding on its own.",
    options: [
      { value: "restful", label: "Consistent and restful" },
      { value: "some", label: "Sometimes disrupted" },
      { value: "often", label: "Frequently disrupted" },
      { value: "unsure", label: "Unsure" },
    ],
  },
  {
    id: "activity",
    chapter: "life",
    text: "How would you describe your current activity level?",
    why: "Activity helps weight, mood and blood sugar: things you can change if you want to.",
    options: [
      { value: "sedentary", label: "Mostly sedentary" },
      { value: "light", label: "Light activity" },
      { value: "moderate", label: "Moderately active" },
      { value: "very", label: "Very active" },
    ],
  },
  {
    id: "heat",
    chapter: "life",
    sex: "male",
    text: "How often is the groin area kept hot, such as hot baths, saunas, or a laptop on your lap?",
    why: "Sperm are made best a little below body temperature.",
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
    ],
  },
  {
    id: "otherConditions",
    chapter: "life",
    multi: true,
    text: "Are there other health conditions or regular medicines you'd like Masar to consider?",
    why: "Some, like diabetes, are best managed before a pregnancy. Choose any that apply.",
    options: [
      { value: "diabetes", label: "Diabetes" },
      { value: "bp", label: "High blood pressure" },
      { value: "thyroid", label: "A thyroid condition" },
      { value: "meds", label: "I take regular medicines" },
      { value: "none", label: "None", exclusive: true },
      { value: "prefer", label: "Prefer not to say", exclusive: true },
    ],
  },

  {
    id: "thyroidKindLife",
    chapter: "life",
    when: (a) => is(a, "otherConditions", "thyroid") && !is(a, "diagnoses", "thyroid"),
    text: "Which kind of thyroid condition?",
    why: "An underactive thyroid is worth planning around before a pregnancy.",
    options: [
      { value: "under", label: "Underactive (hypothyroidism)" },
      { value: "over", label: "Overactive (hyperthyroidism)" },
      { value: "unsure", label: "Unsure" },
    ],
  },

  // ---------- D. Help ----------
  {
    id: "helpful",
    chapter: "help",
    multi: true,
    text: "What would be most helpful to you?",
    why: "Your path will put these first.",
    options: [
      { value: "changes", label: "Understanding changes in my reproductive health" },
      { value: "results", label: "Understanding my test results" },
      { value: "missing", label: "Identifying information I may be missing" },
      { value: "factors", label: "Exploring factors I can discuss with my doctor" },
      { value: "consult", label: "Preparing for a clinical consultation" },
    ],
  },
  {
    id: "prepareQuestions",
    chapter: "help",
    text: "Would you like help preparing questions for your healthcare professional?",
    why: "If yes, your path will include questions you can bring.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "later", label: "Maybe later" },
    ],
  },
];

/** The questions to ask, in order, given the answers so far. Follow-ups always come straight after what they follow. */
export function visibleQuestions(sex: Sex, a: JAnswers): JQuestion[] {
  return QUESTIONS.filter((q) => (!q.sex || q.sex === sex) && (!q.when || q.when(a)));
}

export const questionById = (id: string) => QUESTIONS.find((q) => q.id === id);

export function labelOf(q: JQuestion, v: JAnswer | undefined): string | null {
  if (v === undefined || (Array.isArray(v) && !v.length)) return null;
  const values = Array.isArray(v) ? v : [v];
  return values.map((x) => q.options.find((o) => o.value === x)?.label ?? x).join(", ");
}

// ---------- mapping onto the inputs Masar's rules already read ----------

const GOAL_TO_INTENTION: Record<string, Intention> = {
  now: "TryingNow",
  soon: "TryingSoon",
  future: "MaybeLater",
  preserve: "MaybeLater",
  not: "NotPlanning",
  prefer: "PreferNotToSay",
};

/**
 * The journey's answers, written as the existing rule inputs (lib/profile
 * Answers): the same keys and values the rules have always read. Only answers
 * the person gave are mapped; nothing is inferred.
 */
export function toRuleAnswers(sex: Sex, a: JAnswers): Answers {
  const out: Answers = {};
  const one = (id: string) => (typeof a[id] === "string" ? (a[id] as string) : undefined);
  const many = (id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : []);

  const goal = one("goal");
  if (goal && GOAL_TO_INTENTION[goal]) out.plans = GOAL_TO_INTENTION[goal];

  const smoking = one("smoking");
  if (smoking === "never") out.smoking = "never";
  else if (smoking === "past") out.smoking = "past";
  else if (smoking === "sometimes" || smoking === "regular") out.smoking = "yes";

  const activity = one("activity");
  if (activity) out.activity = { sedentary: "rarely", light: "weekly", moderate: "often", very: "often" }[activity] ?? activity;

  const conditions = new Set<string>();
  for (const c of many("diagnoses")) if (c === "pcos" || c === "endometriosis") conditions.add(c);
  if (one("thyroidKind") === "under" || one("thyroidKindLife") === "under") conditions.add("hypothyroid");
  if (many("otherConditions").includes("diabetes")) conditions.add("diabetes");
  if (conditions.size) out.conditions = [...conditions];

  if (sex === "female") {
    const cycle = one("cycleChange");
    if (cycle === "none") out.cycles = "regular";
    // "Irregular or hard to predict" in the original question covers these three.
    else if (cycle === "irregular" || cycle === "missed" || cycle === "length") out.cycles = "irregular";
    else if (cycle === "absent") out.cycles = "absent";
    else if (cycle === "na" || cycle === "unsure") out.cycles = "unknown";

    const pain = one("periodPain");
    if (pain) out.symptoms = pain;

    const fam = one("familyHistory");
    if (fam === "no") out.familyMenopause = "no";
    else if (fam === "unsure") out.familyMenopause = "unknown";
    else if (fam === "yes") out.familyMenopause = many("familyWhich").includes("menopause") ? "yes" : "unknown";

    const preg = one("pregnantBefore");
    if (preg) out.pregnantBefore = preg;
  } else {
    const steroids = one("steroids");
    if (steroids && steroids !== "prefer") out.steroids = steroids;
    const mh = many("maleHistory").filter((x) => x !== "none");
    if (mh.length) out.maleHistory = mh;
    const heat = one("heat");
    if (heat) out.heat = heat;
    const fathered = one("fatheredBefore");
    if (fathered) out.fatheredBefore = fathered;
  }
  if (one("partnerContext") === "yes") out.partner = "yes";
  return out;
}

const INTENTION_TO_GOAL: Record<string, string> = { TryingNow: "now", TryingSoon: "soon", MaybeLater: "future", NotPlanning: "not", PreferNotToSay: "prefer" };

/** Pre-fills journey answers from rule answers (records, or an earlier version of the questions). */
export function fromRuleAnswers(sex: Sex, r: Answers): JAnswers {
  const out: JAnswers = {};
  const one = (k: string) => (typeof r[k] === "string" ? (r[k] as string) : undefined);
  const many = (k: string) => (Array.isArray(r[k]) ? (r[k] as string[]) : []);
  const plans = one("plans");
  if (plans && INTENTION_TO_GOAL[plans]) out.goal = INTENTION_TO_GOAL[plans];
  const smoking = one("smoking");
  if (smoking === "never" || smoking === "past") out.smoking = smoking;
  else if (smoking === "yes") out.smoking = "regular";
  const cond = many("conditions");
  if (sex === "female") {
    const dx: string[] = cond.filter((c) => c === "pcos" || c === "endometriosis");
    if (cond.includes("hypothyroid")) dx.push("thyroid");
    if (dx.length) out.diagnoses = dx;
    const fam = one("familyMenopause");
    if (fam === "yes") {
      out.familyHistory = "yes";
      out.familyWhich = ["menopause"];
    } else if (fam === "no") out.familyHistory = "no";
    const cycles = one("cycles");
    if (cycles) out.cycleChange = { regular: "none", irregular: "irregular", absent: "absent", unknown: "unsure" }[cycles] ?? "unsure";
    if (one("symptoms")) out.periodPain = one("symptoms")!;
  } else {
    if (one("steroids")) out.steroids = one("steroids")!;
    if (many("maleHistory").length) out.maleHistory = many("maleHistory");
    if (one("heat")) out.heat = one("heat")!;
  }
  if (cond.includes("hypothyroid")) {
    if (sex === "female") out.thyroidKind = "under";
    else out.thyroidKindLife = "under";
  }
  const other: string[] = cond.filter((c) => c === "diabetes");
  if (sex === "male" && cond.includes("hypothyroid")) other.push("thyroid");
  if (other.length) out.otherConditions = other;
  return out;
}

// ---------- the two final questions ----------

export interface FollowUp {
  id: string;
  text: string;
  why: string;
  options: JOption[];
}

export type FollowUpSource = "ai" | "mock" | "fallback";

/**
 * Two context questions Masar asks when the assistant isn't used (or fails).
 * They are fixed, reviewed wording, chosen by simple relevance to what the
 * person said. They gather context; none raises a finding.
 */
const BANK: { when: (a: JAnswers, sex: Sex) => boolean; q: FollowUp }[] = [
  {
    when: (a) => is(a, "cycleChange", "irregular", "missed", "length", "absent") && !a.cycleSince,
    q: {
      id: "fu-cycle-since",
      text: "How long have you noticed these changes in your cycle?",
      why: "How long a change has lasted helps your doctor understand it.",
      options: [
        { value: "lt3", label: "Less than 3 months" },
        { value: "3to12", label: "3 to 12 months" },
        { value: "gt12", label: "More than a year" },
        { value: "unsure", label: "Unsure" },
      ],
    },
  },
  {
    when: (a) => planningSoon(a),
    q: {
      id: "fu-trying-time",
      text: "If you're trying or planning soon, how long have you been trying?",
      why: "How long you've been trying helps your doctor decide what is worth discussing now.",
      options: [
        { value: "notyet", label: "Not started yet" },
        { value: "lt6", label: "Less than 6 months" },
        { value: "6to12", label: "6 to 12 months" },
        { value: "gt12", label: "More than a year" },
        PREFER,
      ],
    },
  },
  {
    when: (a, sex) => is(a, sex === "female" ? "investigations" : "investigationsM", "none", "unsure") || (!a.investigations && !a.investigationsM),
    q: {
      id: "fu-investigations",
      text: "Would you like help understanding which investigations you could discuss with your healthcare professional?",
      why: "Only a doctor can decide whether a test would help; Masar can help you prepare the question.",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "discussed", label: "I have already discussed this with my doctor" },
        { value: "later", label: "Maybe later" },
      ],
    },
  },
  {
    when: (a) => is(a, "familyHistory", "yes"),
    q: {
      id: "fu-family-discussed",
      text: "Have you talked about your family history with a doctor?",
      why: "Family history is easier to act on when your doctor knows about it.",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "Not yet" },
        { value: "unsure", label: "Unsure" },
      ],
    },
  },
  {
    when: () => true,
    q: {
      id: "fu-explain",
      text: "Is there anything you'd like your doctor to explain more clearly?",
      why: "So your path can include the questions that matter to you.",
      options: [
        { value: "results", label: "My test results" },
        { value: "changes", label: "What is changing over time" },
        { value: "options", label: "My options and their timing" },
        { value: "nothing", label: "Nothing right now" },
      ],
    },
  },
];

/** Masar's own two final questions: the first two in the bank that fit what was said. */
export function fallbackFollowUps(sex: Sex, a: JAnswers): FollowUp[] {
  return BANK.filter((b) => b.when(a, sex))
    .slice(0, 2)
    .map((b) => b.q);
}

// ---------- the quick check ----------

/** A fourth statement for the quick check, separate from the three evaluation items. */
export const EXTRA_STATEMENT = {
  text: "A single hormone test can tell us everything about someone's reproductive potential.",
  correct: "false" as const,
  explain: "No single test can. AMH, for example, cannot measure egg quality or predict the chance of getting pregnant.",
};

// ---------- the summary ----------

export interface JourneySummary {
  reproductive_goals: string[];
  health_context: string[];
  reported_changes: string[];
  lifestyle_context: string[];
  additional_context: string[];
  known_information: string[];
  missing_information: string[];
  areas_to_explore: string[];
  suggested_discussion_topics: string[];
  limitations: string[];
}

export const SUMMARY_KEYS: (keyof JourneySummary)[] = [
  "reproductive_goals",
  "health_context",
  "reported_changes",
  "lifestyle_context",
  "additional_context",
  "known_information",
  "missing_information",
  "areas_to_explore",
  "suggested_discussion_topics",
  "limitations",
];

/** Everything a summary may be built from, already limited to what the person shared. */
export interface SummaryInput {
  /** question → answer, self-reported (empty when "What you tell us" is off) */
  goals: string[];
  history: string[];
  changes: string[];
  lifestyle: string[];
  help: string[];
  followUps: string[];
  /** facts from consented records, written plainly */
  records: string[];
  /** titles of findings from Masar's rules */
  findings: string[];
  /** coverage gaps and unanswered questions */
  missing: string[];
  /** rule-derived questions to bring, and options */
  ruleQuestions: string[];
  wantsQuestions: boolean;
}

const cap = (xs: string[], n = 6) => [...new Set(xs.filter(Boolean))].slice(0, n);

/** Masar's own summary, used whenever the assistant isn't used. Every line comes from an input. */
export function deterministicSummary(i: SummaryInput, tr: (s: string) => string = (s) => s): JourneySummary {
  return {
    reproductive_goals: cap(i.goals),
    health_context: cap(i.history),
    reported_changes: cap(i.changes),
    lifestyle_context: cap(i.lifestyle),
    additional_context: cap([...i.followUps, ...i.help]),
    known_information: cap([...i.records, ...(i.goals.length + i.history.length + i.lifestyle.length ? [tr("What you told Masar in this journey (self-reported, not clinically verified).")] : [])]),
    missing_information: cap(i.missing, 8),
    areas_to_explore: cap(i.findings.length ? i.findings : [tr("Nothing in what you shared needs a conversation right now. That isn't a guarantee.")]),
    suggested_discussion_topics: cap(
      i.ruleQuestions.length
        ? i.ruleQuestions
        : i.wantsQuestions
          ? [tr("Is there anything I should check now, given my plans?"), tr("What can I do to look after my fertility?"), tr("When should I come back?")]
          : [],
      5,
    ),
    limitations: [
      tr("This is a summary of what you shared, not a diagnosis or a prediction."),
      tr("Self-reported answers are not clinically verified."),
      tr("Masar only sees the sources you switched on."),
    ],
  };
}
