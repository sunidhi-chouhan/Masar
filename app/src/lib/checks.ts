// The short checks asked before and after. Belief items follow the style of
// the Cardiff Fertility Knowledge Scale, with separate items for women and men;
// the four decision questions follow the SURE test; worry is a single item.

import type { Sex } from "./model";

export interface BeliefItem {
  text: string;
  correct: "true" | "false";
  explain: string;
}

const FOR_WOMEN: BeliefItem[] = [
  {
    text: "A woman's chance of getting pregnant stays about the same until around 40.",
    correct: "false",
    explain: "Fertility declines gradually from the early 30s, and faster after 35.",
  },
  {
    text: "IVF can usually make up for the effect of age on fertility.",
    correct: "false",
    explain: "IVF success also falls with age, so it cannot reliably make up for it.",
  },
  {
    text: "Smoking can lower fertility in both women and men.",
    correct: "true",
    explain: "Smoking affects eggs, sperm and the chance of pregnancy.",
  },
];

const FOR_MEN: BeliefItem[] = [
  {
    text: "A man's age makes no difference to fertility.",
    correct: "false",
    explain: "Sperm quality slowly declines with age, especially after 40.",
  },
  {
    text: "Keeping the groin area hot, like hot baths or a laptop on the lap, can affect sperm.",
    correct: "true",
    explain: "Sperm are made best a little below body temperature.",
  },
  {
    text: "Fertility problems are almost always on the woman's side.",
    correct: "false",
    explain: "Men are part of the cause in about half of couples who struggle to conceive.",
  },
];

export function beliefItems(sex: Sex): BeliefItem[] {
  return sex === "female" ? FOR_WOMEN : FOR_MEN;
}

export const WORRY_LABELS = ["Not worried", "A little worried", "Quite worried", "Very worried"];

export const SURE_ITEMS = [
  "Do you feel sure about the best choice for you?",
  "Do you know the benefits and risks of each option?",
  "Are you clear about which benefits and risks matter most to you?",
  "Do you have enough support and advice to make a choice?",
];

export function beliefScore(sex: Sex, answers: string[] | null): number | null {
  if (!answers) return null;
  const items = beliefItems(sex);
  return answers.filter((a, i) => a === items[i]?.correct).length;
}
