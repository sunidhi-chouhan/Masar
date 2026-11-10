// The signal rules. Each rule is readable, cites its evidence, and says what it
// cannot tell the person. A signal means "worth a conversation now", never a
// diagnosis and never a fertility score.

import type { Condition, OptionKind, Reading, Resident, SourceId, Urgency } from "./model";
import { CONDITION_LABEL } from "./model";
import type { Reported } from "./profile";

export type SignalCode =
  | "FAMILY_EARLY_MENOPAUSE"
  | "AMH_FALL"
  | "AMH_LOW"
  | "CONDITION_PLANS"
  | "AGE35_LATER"
  | "CANCER_BEFORE_TREATMENT"
  | "CYCLE_IRREGULAR"
  | "MALE_LIFESTYLE"
  | "SEMEN_BELOW_REFERENCE"
  | "PERIOD_SYMPTOMS"
  | "MALE_STEROIDS"
  | "MALE_HISTORY"
  | "UNDERWEIGHT_PLANS";

export interface SignalRule {
  code: SignalCode;
  /** what the person sees */
  title: string;
  /** what the clinician sees */
  clinicalTitle: string;
  whyItMatters: string;
  cannotTell: string;
  evidence: { citation: string; strength: "Strong" | "Moderate" };
  options: OptionKind[];
  urgency: Urgency;
  questions: string[];
}

export const RULES: Record<SignalCode, SignalRule> = {
  FAMILY_EARLY_MENOPAUSE: {
    code: "FAMILY_EARLY_MENOPAUSE",
    title: "Early menopause in your family",
    clinicalTitle: "Family history of early menopause, family plans later",
    whyItMatters:
      "Menopause before 45 in a mother or sister can mean reproductive timing is worth discussing earlier than usual.",
    cannotTell: "Family history alone cannot tell when your own menopause will happen or whether you will conceive.",
    evidence: { citation: "ESHRE guideline on premature ovarian insufficiency (2016)", strength: "Moderate" },
    options: ["Counsel", "TestDiscuss", "PreserveDiscuss", "Learn"],
    urgency: "soon",
    questions: [
      "Does my mother's early menopause change when I should think about having children?",
      "Is there a test that would tell us more about my own situation?",
      "If I want to wait, what are my options and their limits?",
    ],
  },
  AMH_FALL: {
    code: "AMH_FALL",
    title: "A drop in your egg-reserve hormone (AMH)",
    clinicalTitle: "AMH fell by 25% or more between two results",
    whyItMatters:
      "AMH is a hormone that gives a rough idea of how many eggs you have left. It fell by more than the normal ups and downs between tests, so it is worth talking through with a doctor.",
    cannotTell: "AMH cannot measure egg quality or predict your chance of getting pregnant naturally.",
    evidence: { citation: "ASRM committee opinion: testing and interpreting ovarian reserve (2020)", strength: "Moderate" },
    options: ["TestDiscuss", "Counsel", "PreserveDiscuss", "Learn"],
    urgency: "soon",
    questions: [
      "What does the fall in my AMH mean for my plans?",
      "Would an ultrasound to count egg follicles tell us more?",
      "Is egg freezing worth discussing at my age?",
    ],
  },
  AMH_LOW: {
    code: "AMH_LOW",
    title: "Egg-reserve hormone (AMH) lower than usual",
    clinicalTitle: "Latest AMH below 1.0 ng/mL",
    whyItMatters: "A lower AMH can be relevant to timing and options, so it is worth talking through.",
    cannotTell: "AMH cannot measure egg quality or predict your chance of getting pregnant naturally.",
    evidence: { citation: "ASRM committee opinion: testing and interpreting ovarian reserve (2020)", strength: "Moderate" },
    options: ["TestDiscuss", "Counsel", "PreserveDiscuss", "Learn"],
    urgency: "soon",
    questions: [
      "What does a lower AMH mean, and what does it not mean?",
      "Should anything else be checked?",
      "What are my options if I want children later?",
    ],
  },
  CONDITION_PLANS: {
    code: "CONDITION_PLANS",
    title: "A condition worth planning around",
    clinicalTitle: "Relevant condition and pregnancy plans within a few years",
    whyItMatters:
      "Some conditions are best managed before trying for a pregnancy. Planning early gives more time to get things in a good place.",
    cannotTell: "Having this condition does not mean you will have difficulty conceiving.",
    evidence: {
      citation: "Condition-specific preconception guidance (International PCOS guideline 2023; NICE NG3; ATA 2017)",
      strength: "Strong",
    },
    options: ["Counsel", "Optimise", "Learn"],
    urgency: "routine",
    questions: [
      "Should my treatment change before I try for a pregnancy?",
      "What should my levels be before trying?",
      "How far ahead should I start planning?",
    ],
  },
  AGE35_LATER: {
    code: "AGE35_LATER",
    title: "35 or older and thinking about later",
    clinicalTitle: "Age 35+, plans later, no reserve assessment",
    whyItMatters:
      "Fertility gradually declines with age and faster after 35. If children may come later, knowing your options now keeps them open.",
    cannotTell: "Age alone cannot tell you how fertile you are today.",
    evidence: { citation: "ACOG committee opinion 589: female age-related fertility decline (2014)", strength: "Strong" },
    options: ["TestDiscuss", "PreserveDiscuss", "Counsel", "Learn"],
    urgency: "soon",
    questions: [
      "Would a reserve test be useful for me?",
      "What are the real success rates of egg freezing at my age?",
      "How long can I reasonably wait?",
    ],
  },
  CANCER_BEFORE_TREATMENT: {
    code: "CANCER_BEFORE_TREATMENT",
    title: "Fertility preservation before treatment",
    clinicalTitle: "New cancer diagnosis, reproductive age, treatment not started",
    whyItMatters:
      "Some cancer treatments can affect fertility. Options to preserve it are best discussed before treatment starts.",
    cannotTell: "This does not mean your treatment will affect your fertility; your care team will advise.",
    evidence: { citation: "ASCO guideline: fertility preservation in people with cancer (2018)", strength: "Strong" },
    options: ["PreserveDiscuss", "Refer"],
    urgency: "urgent",
    questions: [
      "Could my treatment affect my fertility?",
      "What preservation options are there, and how much time do I have?",
      "Who can I speak to this week?",
    ],
  },
  CYCLE_IRREGULAR: {
    code: "CYCLE_IRREGULAR",
    title: "Cycles outside the usual range",
    clinicalTitle: "Recent cycles irregular or outside 21–35 days",
    whyItMatters: "Cycles that are often outside the usual range are worth a routine check with a doctor.",
    cannotTell: "Cycle patterns alone do not confirm ovulation, egg quality, or a diagnosis.",
    evidence: { citation: "FIGO normal limits of menstruation (2018)", strength: "Moderate" },
    options: ["Counsel", "TestDiscuss", "Learn"],
    urgency: "routine",
    questions: [
      "Are my cycles something to look into?",
      "Which tests would help, if any?",
      "Could this be linked to thyroid or PCOS?",
    ],
  },
  UNDERWEIGHT_PLANS: {
    code: "UNDERWEIGHT_PLANS",
    title: "Weight below the usual range, with plans for children",
    clinicalTitle: "BMI below 18.5 with pregnancy plans",
    whyItMatters:
      "Being underweight can stop or delay ovulation. Gaining towards a healthy weight often brings regular cycles back, so it is worth planning ahead.",
    cannotTell: "Weight alone cannot tell whether you are ovulating or how fertile you are.",
    evidence: { citation: "NICE guideline CG156: fertility problems, assessment and treatment (2013, updated 2017)", strength: "Moderate" },
    options: ["Optimise", "Counsel", "Learn"],
    urgency: "routine",
    questions: [
      "Could my weight be affecting my cycles?",
      "What is a healthy weight for me to aim for before a pregnancy?",
      "Should anything else be checked, like my thyroid or iron?",
    ],
  },
  MALE_LIFESTYLE: {
    code: "MALE_LIFESTYLE",
    title: "Smoking and weight, with plans for children",
    clinicalTitle: "Current smoker, BMI 30+, planning a pregnancy",
    whyItMatters:
      "Smoking and a higher BMI are linked to lower sperm quality. Both can improve, and changes take about three months to show.",
    cannotTell: "These factors alone cannot tell whether there is a fertility problem.",
    evidence: { citation: "ASRM practice committee: smoking and infertility (2018)", strength: "Moderate" },
    options: ["Optimise", "TestDiscuss", "Learn"],
    urgency: "routine",
    questions: [
      "Is a semen analysis worth doing now?",
      "What support is there to stop smoking?",
      "How long before changes make a difference?",
    ],
  },
  SEMEN_BELOW_REFERENCE: {
    code: "SEMEN_BELOW_REFERENCE",
    title: "A sperm test result lower than usual",
    clinicalTitle: "Sperm concentration below WHO lower reference (16 M/mL)",
    whyItMatters: "A result below the reference is worth repeating and discussing with a specialist.",
    cannotTell: "One result cannot tell whether you can father a child; results vary between tests.",
    evidence: { citation: "WHO laboratory manual for semen examination, 6th edition (2021)", strength: "Strong" },
    options: ["Refer", "Optimise", "Learn"],
    urgency: "soon",
    questions: [
      "Should the test be repeated?",
      "What could be affecting the result?",
      "Who should I see next?",
    ],
  },
  PERIOD_SYMPTOMS: {
    code: "PERIOD_SYMPTOMS",
    title: "Very painful or very heavy periods",
    clinicalTitle: "Reported severe dysmenorrhoea or heavy menstrual bleeding",
    whyItMatters:
      "Periods that are very painful or very heavy are worth checking. Sometimes they come from conditions like endometriosis or fibroids, which are easier to manage when found early.",
    cannotTell: "Painful or heavy periods do not mean you have a condition, or that you will have trouble getting pregnant.",
    evidence: { citation: "ESHRE guideline on endometriosis (2022)", strength: "Strong" },
    options: ["Counsel", "Learn"],
    urgency: "routine",
    questions: [
      "Could something be causing my painful or heavy periods?",
      "Is a scan worth doing?",
      "What can help with the pain or bleeding in the meantime?",
    ],
  },
  MALE_STEROIDS: {
    code: "MALE_STEROIDS",
    title: "Testosterone or steroid use",
    clinicalTitle: "Exogenous testosterone or anabolic steroid use, current or past",
    whyItMatters:
      "Taking testosterone or bodybuilding steroids can switch off the body's own sperm production. It often recovers after stopping, but it can take months.",
    cannotTell: "This cannot tell whether your sperm production is affected now. Only a test can show that.",
    evidence: { citation: "AUA/ASRM guideline on male infertility (2020)", strength: "Strong" },
    options: ["Counsel", "TestDiscuss", "Learn"],
    urgency: "soon",
    questions: [
      "Could the testosterone or steroids have affected my fertility?",
      "How long does recovery take after stopping?",
      "Should I have a semen test?",
    ],
  },
  MALE_HISTORY: {
    code: "MALE_HISTORY",
    title: "Past problems that can affect sperm",
    clinicalTitle: "History of cryptorchidism, post-pubertal mumps orchitis, or testicular trauma or surgery",
    whyItMatters:
      "A testicle that didn't drop as a child, mumps after puberty, or an injury can sometimes affect sperm. If you're planning children, a simple test can give you peace of mind or an early start.",
    cannotTell: "Many men with this history have no fertility problems at all.",
    evidence: { citation: "AUA/ASRM guideline on male infertility (2020)", strength: "Moderate" },
    options: ["TestDiscuss", "Counsel", "Learn"],
    urgency: "routine",
    questions: [
      "Does my history make a semen test worthwhile?",
      "When should I have it done?",
      "Is there anything I can do now to help?",
    ],
  },
};

/** Each option says what it is, and what happens once the person asks for it. */
export const OPTION_LABEL: Record<OptionKind, { title: string; body: string; next: string }> = {
  Learn: {
    title: "Understand what this means",
    body: "Plain-language reading, at your own pace.",
    next: "Your doctor sends you reading matched to what Masar found, and you can ask the assistant anything.",
  },
  Optimise: {
    title: "Work on what you can change",
    body: "Support with things like smoking, weight and sleep.",
    next: "Your doctor connects you with support, such as a stop-smoking or nutrition service, and checks in after three months.",
  },
  TestDiscuss: {
    title: "Ask about a test",
    body: "A test that could narrow the uncertainty, discussed with a doctor first.",
    next: "Your doctor decides whether a test would help, orders it, and goes through the result with you.",
  },
  Counsel: {
    title: "Talk to a doctor about your plans",
    body: "A pre-pregnancy conversation about timing and options.",
    next: "Your doctor reviews your summary and books a conversation, usually within two to three weeks.",
  },
  PreserveDiscuss: {
    title: "Talk about preserving fertility",
    body: "Including egg or sperm freezing: what it involves and its limits.",
    next: "Your doctor talks it through first and, if it suits you, refers you to a fertility clinic for an assessment.",
  },
  Refer: {
    title: "See a specialist",
    body: "A referral, decided with your doctor.",
    next: "Your doctor reviews and, if needed, sends a referral. You can follow it here until it is booked.",
  },
};

export interface Signal {
  code: SignalCode;
  /** the recorded facts that triggered it, in plain words */
  reasons: string[];
  /** which consented sources the facts came from */
  sources: SourceId[];
}

/**
 * What Masar is allowed to see of a person: only facts from sources they
 * switched on. Facts from a source that is off simply do not exist here.
 */
export interface VisibleRecord {
  sex: Resident["sex"];
  age: number;
  intention: Resident["intention"] | null;
  conditions: Condition[];
  familyEarlyMenopause: boolean | null;
  smoker: boolean | null;
  readings: Reading[];
  /** the person's own answers, only when "What you tell us" is switched on */
  reported: Reported | null;
}

export function visibleRecord(r: Resident, sources: Record<SourceId, boolean>, reported: Reported | null = null): VisibleRecord {
  return {
    reported: sources.self ? reported : null,
    sex: r.sex,
    age: r.age,
    intention: sources.self ? r.intention : null,
    conditions: sources.malaffi ? r.conditions : [],
    familyEarlyMenopause: sources.self ? r.familyEarlyMenopause : null,
    smoker: sources.self || sources.healthAge ? r.smoker : null,
    readings: r.readings.filter((x) => sources[x.source]),
  };
}

export const ALL_SOURCES: Record<SourceId, boolean> = { self: true, malaffi: true, lab: true, healthAge: true, device: true };

export function series(readings: Reading[], code: Reading["code"]): Reading[] {
  return readings.filter((x) => x.code === code).sort((a, b) => a.at.localeCompare(b.at));
}

const DAY = 86_400_000;
const plansLater = (i: VisibleRecord["intention"]) => i === "NotPlanning" || i === "MaybeLater" || i === "PreferNotToSay";
const plansSoon = (i: VisibleRecord["intention"]) => i === "MaybeLater" || i === "TryingSoon" || i === "TryingNow";
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function signalsFor(v: VisibleRecord): Signal[] {
  const out: Signal[] = [];
  const amh = series(v.readings, "amh");
  const latestAmh = amh.at(-1);

  if (v.sex === "female") {
    if (v.familyEarlyMenopause && plansLater(v.intention) && v.age >= 28) {
      out.push({
        code: "FAMILY_EARLY_MENOPAUSE",
        reasons: ["Your mother or sister went through menopause before 45", `You are ${v.age} and plan children later`],
        sources: ["self"],
      });
    }

    if (amh.length >= 2) {
      const prev = amh[amh.length - 2];
      const last = amh[amh.length - 1];
      const apart = (Date.parse(last.at) - Date.parse(prev.at)) / DAY;
      if (apart >= 180 && (prev.value - last.value) / prev.value >= 0.25) {
        out.push({
          code: "AMH_FALL",
          reasons: [`Egg-reserve hormone (AMH) fell from ${fmt(prev.value)} to ${fmt(last.value)} ng/mL over ${Math.round(apart / 30)} months`],
          sources: ["lab"],
        });
      }
    }

    if (latestAmh && latestAmh.value < 1.0) {
      out.push({ code: "AMH_LOW", reasons: [`Latest egg-reserve hormone (AMH) result: ${fmt(latestAmh.value)} ng/mL`], sources: ["lab"] });
    }

    if (v.age >= 35 && v.intention === "MaybeLater" && amh.length === 0) {
      out.push({
        code: "AGE35_LATER",
        reasons: [`You are ${v.age} and may want children later`, "No egg-reserve test on record"],
        sources: ["self"],
      });
    }

    const weight = series(v.readings, "bmi").at(-1);
    if (weight && weight.value < 18.5 && v.intention && v.intention !== "NotPlanning" && v.intention !== "PreferNotToSay") {
      out.push({
        code: "UNDERWEIGHT_PLANS",
        reasons: [`Weight for height (BMI) is ${fmt(weight.value)}, below the usual 18.5–25`, "You may want children"],
        sources: [weight.source],
      });
    }

    const told = v.reported?.cycles;
    if (told === "irregular" || told === "absent") {
      out.push({
        code: "CYCLE_IRREGULAR",
        reasons: [told === "absent" ? "You told us you haven't had a period for 3 months or more" : "You told us your periods are irregular"],
        sources: ["self"],
      });
    }
    const symptoms = v.reported?.symptoms;
    if (symptoms && symptoms !== "none") {
      const what = symptoms === "both" ? "very painful and very heavy" : symptoms === "pain" ? "very painful" : "very heavy";
      out.push({ code: "PERIOD_SYMPTOMS", reasons: [`You told us your periods are ${what}`], sources: ["self"] });
    }

    const cycles = series(v.readings, "cycle_length").slice(-6);
    if (cycles.length >= 3 && !out.some((x) => x.code === "CYCLE_IRREGULAR")) {
      const values = cycles.map((c) => c.value);
      const outside = values.filter((x) => x < 21 || x > 35).length;
      if (outside >= 2) {
        out.push({
          code: "CYCLE_IRREGULAR",
          reasons: [`${outside} of your last ${values.length} cycles were outside 21–35 days`],
          sources: ["device"],
        });
      }
    }
  }

  const planningConditions = v.conditions.filter((c) => c !== "cancer_new");
  if (planningConditions.length > 0 && plansSoon(v.intention)) {
    out.push({
      code: "CONDITION_PLANS",
      reasons: [...planningConditions.map((c) => `${CONDITION_LABEL[c]} on record`), "Pregnancy possible within a few years"],
      sources: ["malaffi", "self"],
    });
  }

  if (v.conditions.includes("cancer_new") && v.age >= 18 && v.age <= 42) {
    out.push({
      code: "CANCER_BEFORE_TREATMENT",
      reasons: ["New cancer diagnosis on record", "Treatment has not started yet"],
      sources: ["malaffi"],
    });
  }

  if (v.sex === "male") {
    const bmi = series(v.readings, "bmi").at(-1);
    if (v.smoker && bmi && bmi.value >= 30 && (v.intention === "TryingSoon" || v.intention === "TryingNow")) {
      out.push({
        code: "MALE_LIFESTYLE",
        reasons: ["You currently smoke", `Weight for height (BMI) is ${fmt(bmi.value)}`, "Planning children soon"],
        sources: ["self", "healthAge"],
      });
    }
    const steroids = v.reported?.steroids;
    if (steroids === "now" || steroids === "past") {
      out.push({
        code: "MALE_STEROIDS",
        reasons: [steroids === "now" ? "You told us you currently use testosterone or steroids" : "You told us you have used testosterone or steroids"],
        sources: ["self"],
      });
    }
    if ((v.reported?.maleHistory ?? []).length && v.intention !== "NotPlanning") {
      out.push({ code: "MALE_HISTORY", reasons: ["You told us about a past problem that can affect sperm"], sources: ["self"] });
    }
    const semen = series(v.readings, "semen_concentration").at(-1);
    if (semen && semen.value < 16) {
      out.push({
        code: "SEMEN_BELOW_REFERENCE",
        reasons: [`Sperm count ${fmt(semen.value)} million per mL (the usual is 16 or more)`],
        sources: ["lab"],
      });
    }
  }

  return out;
}

const URGENCY_RANK: Record<Urgency, number> = { urgent: 0, soon: 1, routine: 2 };

export function topUrgency(signals: Signal[]): Urgency | null {
  if (!signals.length) return null;
  return signals.map((s) => RULES[s.code].urgency).sort((a, b) => URGENCY_RANK[a] - URGENCY_RANK[b])[0];
}

// Reasons are written to the person ("You are 39…"). The doctor reads the same
// facts in clinical shorthand.
const CLINICAL: [RegExp, string][] = [
  [/^Your mother or sister went through menopause before 45$/, "First-degree relative with menopause before 45"],
  [/^You are (\d+) and plan children later$/, "Age $1; plans children later"],
  [/^You are (\d+) and may want children later$/, "Age $1; may want children later"],
  [/^Egg-reserve hormone \(AMH\) fell from (.+)$/, "AMH fell from $1"],
  [/^Latest egg-reserve hormone \(AMH\) result: (.+)$/, "Latest AMH $1"],
  [/^You told us you haven't had a period for 3 months or more$/, "Reports amenorrhoea of 3 months or more"],
  [/^You told us your periods are irregular$/, "Reports irregular cycles"],
  [/^You told us your periods are (.+)$/, "Reports $1 periods"],
  [/^(\d+) of your last (\d+) cycles were outside 21–35 days$/, "$1 of last $2 cycles outside 21–35 days (device)"],
  [/^You currently smoke$/, "Current smoker"],
  [/^Weight for height \(BMI\) is ([\d.]+), below the usual 18\.5–25$/, "BMI $1 (underweight)"],
  [/^Weight for height \(BMI\) is (.+)$/, "BMI $1"],
  [/^You may want children$/, "Pregnancy plans recorded"],
  [/^Planning children soon$/, "Planning conception soon"],
  [/^You told us you currently use testosterone or steroids$/, "Reports current exogenous testosterone or anabolic steroid use"],
  [/^You told us you have used testosterone or steroids$/, "Reports past exogenous testosterone or anabolic steroid use"],
  [/^You told us about a past problem that can affect sperm$/, "Reports history relevant to spermatogenesis (see answers)"],
  [/^Sperm count (.+) million per mL \(the usual is 16 or more\)$/, "Sperm concentration $1 M/mL (WHO lower reference 16)"],
];

export function clinicalReason(reason: string): string {
  for (const [pattern, text] of CLINICAL) if (pattern.test(reason)) return reason.replace(pattern, text);
  return reason;
}

/** Options offered, in order of first appearance across the person's signals. */
export function optionsFor(signals: Signal[]): OptionKind[] {
  const seen = new Set<OptionKind>();
  for (const s of signals) for (const o of RULES[s.code].options) seen.add(o);
  return [...seen];
}
