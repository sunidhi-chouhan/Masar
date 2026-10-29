"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { LivingWellCard as CardData } from "@/lib/living-well/content";
import { pick } from "@/lib/living-well/content";
import { getEvidence } from "@/lib/evidence/library";
import { EvidenceChip, TierRibbon } from "@/components/ui/atoms";

const LIST_KEY = "masar_question_list";

export function readQuestionList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(LIST_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function writeQuestionList(list: string[]) {
  window.localStorage.setItem(LIST_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("masar-questions"));
}

export function LivingWellCard({ card }: { card: CardData }) {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const ev = getEvidence(card.evidenceId);
  const question = pick(card, "askClinician", locale);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(question);
    } catch {
      /* clipboard may be unavailable; list still updates */
    }
    const list = readQuestionList();
    if (!list.includes(question)) writeQuestionList([...list, question]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <article className="surface-paper lift flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-ink-900">{pick(card, "title", locale)}</h3>
        <EvidenceChip strength={card.strength} compact />
      </div>
      <p className="mt-3 text-ink-900">{pick(card, "claim", locale)}</p>
      <div className="mt-3 rounded-md border border-dashed border-slate-400/70 bg-slate-200/30 p-3 text-sm text-slate-600">
        <p className="label-caps mb-1 !text-slate-600">{t("livingWell.cannot")}</p>
        {pick(card, "cannot", locale)}
      </div>
      <div className="mt-4 flex-1 rounded-md bg-mist-100/60 p-3 text-sm">
        <p className="label-caps mb-1">{t("livingWell.askClinician")}</p>
        <p className="text-ink-900">{question}</p>
        <button type="button" onClick={copy} className="mt-2 text-xs text-mist-700 underline-offset-4 hover:underline" aria-live="polite">
          {copied ? t("livingWell.copied") : t("livingWell.copy")}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-400">
        <TierRibbon tier="Education" />
        {ev ? (
          <a href={ev.url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
            {ev.organisation} {ev.year}
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function QuestionList() {
  const { t } = useI18n();
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setList(readQuestionList());
    sync();
    window.addEventListener("masar-questions", sync);
    return () => window.removeEventListener("masar-questions", sync);
  }, []);
  return (
    <aside className="surface p-5">
      <h2 className="text-ink-900">{t("livingWell.questionList")}</h2>
      <p className="mt-1 text-sm text-ink-600">{t("livingWell.questionListBody")}</p>
      {list.length ? (
        <ol className="mt-3 list-decimal space-y-2 ps-5 text-sm text-ink-900">
          {list.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-ink-400">{t("livingWell.emptyList")}</p>
      )}
      {list.length ? (
        <button type="button" onClick={() => writeQuestionList([])} className="mt-3 text-xs text-ink-400 underline-offset-4 hover:underline">
          {t("common.cancel")}
        </button>
      ) : null}
    </aside>
  );
}
