"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import { demoImportAmh, type DemoImportResult } from "@/server/actions/demo";
import { Button, DirectionBadge, SimulatedBadge } from "@/components/ui/atoms";
import type { Confidence, Direction } from "@/lib/domain/types";

export interface ExistingAmh {
  value: number;
  unit: string;
  effectiveAt: string;
}

interface Props {
  /** Mariam's current reserve reading, straight from the saved assessment. */
  current: { direction: Direction; confidence: Confidence };
  /** A lab AMH already in her record, if any (so a reload shows the truth). */
  existing: ExistingAmh | null;
  referenceLower: number;
}

/**
 * Chapter 3. One button writes a synthetic AMH result for Mariam through the
 * real connector path, then the page re-renders from the database. The card
 * only ever shows what the server returned; nothing here is invented client-side.
 */
export function ImportCard({ current, existing, referenceLower }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<DemoImportResult | null>(null);

  const run = () =>
    start(async () => {
      const r = await demoImportAmh();
      setResult(r);
      router.refresh();
    });

  const obs = result?.observation ?? existing;
  const before = result?.before ?? null;
  const after = result?.after ?? current;

  return (
    <section className="surface-paper relative overflow-hidden p-5" aria-labelledby="import-card-title">
      <div aria-hidden className="glow glow-amber pointer-events-none -end-16 -top-16 h-48 w-48" />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="import-card-title" className="text-ink-900">
            {t("demo.importCard.title")}
          </h2>
          <SimulatedBadge />
        </div>
        <p className="mt-2 text-ink-600">{existing && !result ? t("demo.importCard.bodyHas") : t("demo.importCard.body")}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button tone="amber" disabled={pending} onClick={run}>
            {pending ? "…" : t("demo.importButton")}
          </Button>
          {result?.status === "ok" ? <span className="text-sm text-mist-700">{t("demo.importCard.added")}</span> : null}
          {result?.status === "duplicate" ? <span className="text-sm text-ink-600">{t("demo.importCard.already")}</span> : null}
          {result?.status === "blocked" ? <span className="text-sm text-slate-600">{t("demo.importCard.blocked")}</span> : null}
          {!result && !existing ? <span className="text-sm text-ink-400">{t("demo.importCard.noteStatic")}</span> : null}
        </div>

        {obs ? (
          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
            <dl className="rounded-lg border border-dawn-200 bg-dawn-50/70 p-4 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="label-caps text-ink-400">AMH</dt>
                <dd className="font-display text-2xl text-ink-900">
                  {obs.value.toFixed(2)}{" "}
                  <span className="text-base text-ink-600">{obs.unit}</span>
                </dd>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-ink-600">
                <span>
                  <span className="text-ink-400">{t("common.date")}:</span> {formatDate(obs.effectiveAt, locale)}
                </span>
                <span>
                  <span className="text-ink-400">{t("common.source")}:</span> {t("demo.importCard.source")}
                </span>
                <span>{t("demo.importCard.reference", { ref: referenceLower.toFixed(1), unit: obs.unit })}</span>
              </div>
            </dl>

            <div className="flex items-center gap-3 self-center">
              {before ? (
                <>
                  <div className="text-center">
                    <p className="label-caps text-ink-400">{t("demo.importCard.before")}</p>
                    <div className="mt-1">
                      <DirectionBadge direction={before.direction} confidence={before.confidence} />
                    </div>
                  </div>
                  <span aria-hidden className="text-ink-400 rtl:-scale-x-100">
                    →
                  </span>
                </>
              ) : null}
              <div className="text-center">
                <p className="label-caps text-ink-400">{before ? t("demo.importCard.after") : t("confidence.label")}</p>
                <div className="mt-1">
                  <DirectionBadge direction={after?.direction ?? current.direction} confidence={after?.confidence ?? current.confidence} />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {obs ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="font-medium text-ink-900">{t("demo.importCard.whatAdds")}</p>
              <p className="mt-1 text-sm text-ink-600">{t("demo.importCard.whatAddsBody")}</p>
            </div>
            <div>
              <p className="font-medium text-ink-900">{t("demo.importCard.cannot")}</p>
              <p className="mt-1 text-sm text-ink-600">{t("demo.importCard.cannotBody")}</p>
            </div>
            <p className="sm:col-span-2 text-xs text-ink-400">{t("demo.importCard.persisted")}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
