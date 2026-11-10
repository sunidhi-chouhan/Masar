// The health questions a person answers about themselves. Women and men get
// different questions where their bodies differ, and the same ones where they
// don't. Every question can be skipped. Answers are only used when the person
// has switched on "What you tell us".

import type { Condition, Intention, Resident, Sex } from "./model";

export interface Question {
  id: string;
  text: string;
  hint?: string;
  /** one answer, or several */
  multi?: boolean;
  options: { value: string; label: string }[];
}

const PLANS: Question = {
  id: "plans",
  text: "Are you thinking about having children?",
  options: [
    { value: "NotPlanning", label: "Not at the moment" },
    { value: "MaybeLater", label: "Maybe in a few years" },
    { value: "TryingSoon", label: "Within the next year" },
    { value: "TryingNow", label: "We're trying now" },
    { value: "PreferNotToSay", label: "I'd rather not say" },
  ],
};

const PARTNER: Question = {
  id: "partner",
  text: "Do you have a partner?",
  options: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "skip", label: "I'd rather not say" },
  ],
};

const SMOKING: Question = {
  id: "smoking",
  text: "Do you smoke, including shisha or vaping?",
  options: [
    { value: "never", label: "Never" },
    { value: "past", label: "I used to" },
    { value: "yes", label: "Yes" },
  ],
};

const SLEEP: Question = {
  id: "sleep",
  text: "How much do you usually sleep?",
  options: [
    { value: "lt6", label: "Less than 6 hours" },
    { value: "6to7", label: "6 to 7 hours" },
    { value: "7to9", label: "7 to 9 hours" },
    { value: "gt9", label: "More than 9 hours" },
  ],
};

const STRESS: Question = {
  id: "stress",
  text: "How stressed have you felt lately?",
  options: [
    { value: "low", label: "Mostly calm" },
    { value: "some", label: "Some stress" },
    { value: "high", label: "Very stressed" },
  ],
};

const ACTIVITY: Question = {
  id: "activity",
  text: "How often are you active enough to get out of breath?",
  options: [
    { value: "rarely", label: "Rarely" },
    { value: "weekly", label: "Once or twice a week" },
    { value: "often", label: "Three times a week or more" },
  ],
};

const WOMEN: Question[] = [
  {
    id: "cycles",
    text: "How are your periods?",
    options: [
      { value: "regular", label: "Regular, about every 3 to 5 weeks" },
      { value: "irregular", label: "Irregular or hard to predict" },
      { value: "absent", label: "None for 3 months or more" },
      { value: "unknown", label: "Not sure, or on hormonal contraception" },
    ],
  },
  {
    id: "symptoms",
    text: "Do you have very painful or very heavy periods?",
    options: [
      { value: "none", label: "No" },
      { value: "pain", label: "Very painful" },
      { value: "heavy", label: "Very heavy" },
      { value: "both", label: "Both" },
    ],
  },
  {
    id: "pregnantBefore",
    text: "Have you been pregnant before?",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
      { value: "skip", label: "I'd rather not say" },
    ],
  },
  {
    id: "familyMenopause",
    text: "Did your mother or a sister go through menopause before 45?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unknown", label: "I don't know" },
    ],
  },
  {
    id: "conditions",
    text: "Has a doctor ever told you that you have any of these?",
    multi: true,
    options: [
      { value: "pcos", label: "PCOS" },
      { value: "hypothyroid", label: "An underactive thyroid" },
      { value: "endometriosis", label: "Endometriosis" },
      { value: "diabetes", label: "Diabetes" },
    ],
  },
];

const MEN: Question[] = [
  {
    id: "fatheredBefore",
    text: "Have you fathered a pregnancy before?",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
      { value: "skip", label: "I'd rather not say" },
    ],
  },
  {
    id: "maleHistory",
    text: "Have you ever had any of these?",
    multi: true,
    options: [
      { value: "undescended", label: "A testicle that hadn't dropped as a child" },
      { value: "mumps", label: "Mumps as a teenager or adult" },
      { value: "injury", label: "An injury or operation down there" },
    ],
  },
  {
    id: "steroids",
    text: "Have you used testosterone or bodybuilding steroids?",
    options: [
      { value: "never", label: "Never" },
      { value: "past", label: "In the past" },
      { value: "now", label: "Yes, currently" },
    ],
  },
  {
    id: "heat",
    text: "How often is the groin area kept hot, such as hot baths, saunas, or a laptop on your lap?",
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
    ],
  },
  {
    id: "conditions",
    text: "Has a doctor ever told you that you have any of these?",
    multi: true,
    options: [
      { value: "diabetes", label: "Diabetes" },
      { value: "hypothyroid", label: "An underactive thyroid" },
    ],
  },
];

export function questionsFor(sex: Sex): Question[] {
  return [PLANS, PARTNER, ...(sex === "female" ? WOMEN : MEN), SMOKING, SLEEP, STRESS, ACTIVITY];
}

export type Answers = Record<string, string | string[]>;

/** Pre-fill from what the records already say, so people check rather than retype. */
export function answersFromRecords(r: Resident): Answers {
  const a: Answers = { plans: r.intention, smoking: r.smoker ? "yes" : "never" };
  if (r.sex === "female") {
    a.familyMenopause = r.familyEarlyMenopause ? "yes" : "unknown";
    a.conditions = r.conditions.filter((c) => c !== "cancer_new");
  } else {
    a.conditions = r.conditions.filter((c) => c === "diabetes" || c === "hypothyroid");
  }
  return a;
}

/** What a person told us, in the shape the rules read. */
export interface Reported {
  cycles?: string;
  symptoms?: string;
  pregnantBefore?: string;
  fatheredBefore?: string;
  maleHistory: string[];
  steroids?: string;
  heat?: string;
  sleep?: string;
  stress?: string;
  activity?: string;
  partner?: string;
}

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
const many = (v: string | string[] | undefined) => (Array.isArray(v) ? v : []);

/** Apply a person's own answers on top of their records. Their answers win. */
export function applyAnswers(r: Resident, a: Answers): { resident: Resident; reported: Reported } {
  const plans = one(a.plans) as Intention | undefined;
  const smoking = one(a.smoking);
  const family = one(a.familyMenopause);
  const told = many(a.conditions) as Condition[];
  return {
    resident: {
      ...r,
      intention: plans ?? r.intention,
      smoker: smoking ? smoking === "yes" : r.smoker,
      familyEarlyMenopause: family ? family === "yes" : r.familyEarlyMenopause,
      conditions: [...new Set([...r.conditions, ...told])],
    },
    reported: {
      cycles: one(a.cycles),
      symptoms: one(a.symptoms),
      pregnantBefore: one(a.pregnantBefore),
      fatheredBefore: one(a.fatheredBefore),
      maleHistory: many(a.maleHistory),
      steroids: one(a.steroids),
      heat: one(a.heat),
      sleep: one(a.sleep),
      stress: one(a.stress),
      activity: one(a.activity),
      partner: one(a.partner),
    },
  };
}

export function labelFor(q: Question, value: string): string {
  return q.options.find((o) => o.value === value)?.label ?? value;
}
