import Link from "next/link";
import { forbidden } from "next/navigation";
import { requireRole } from "@/lib/page-context";
import { AccessDeniedError } from "@/lib/consent/authorize";
import { assessmentHistory, listActions, loadPatientBundle, type PatientBundle } from "@/server/patient";
import { listReviews } from "@/server/clinician";
import { ageFromBirthYear, DATA_SOURCES, type ActionState, type Confidence, type Direction, type Domain } from "@/lib/domain/types";
import { STALENESS_MONTHS } from "@/lib/engine/rules";
import { formatDate } from "@/lib/i18n/format";
import { DirectionBadge, EvidenceChip, Page } from "@/components/ui/atoms";
import { Reveal } from "@/components/ui/motion";
import { ConfidenceBand } from "@/components/charts/confidence-band";
import { bandFor } from "@/lib/engine/bands";
import { HistoryList } from "@/components/trajectory/history-list";
import { PathStepper } from "@/components/actions/action-card";
import { ReviewForm } from "@/components/clinician/review-form";

export default async function OnePagerPage({ params }: PageProps<"/[locale]/clinician/patients/[id]">) {
  const { id } = await params;
  const { locale, t, session } = await requireRole(params, ["clinician"]);
  const actor = { userId: session.userId, role: session.role };

  let bundle: PatientBundle;
  try {
    bundle = await loadPatientBundle(actor, id, "ClinicianReview", "one-pager");
  } catch (e) {
    // The refusal has already been written to the subject's access log by
    // authorize(). forbidden() turns it into a real HTTP 403 response,
    // rendered by ./forbidden.tsx.
    if (e instanceof AccessDeniedError) forbidden();
    throw e;
  }

  const [history, actions, reviews] = await Promise.all([assessmentHistory(id), listActions(id), listReviews(id)]);
  const name = locale === "ar" ? bundle.user.nameAr : bundle.user.name;
  const discuss = bundle.results.filter((r) => r.direction === "Discuss" || r.direction === "Shifting");
  const chartDomain = (discuss[0]?.domain ?? bundle.results[0]?.domain) as Domain;
  const band = bandFor(chartDomain);
  const points = band
    ? bundle.observations
        .filter((o) => o.code === band.code && o.valueNum !== null)
        .map((o) => ({ at: o.effectiveAt.toISOString(), value: o.valueNum as number, source: t(`privacy.sources.${o.dataSourceId}`) }))
    : [];
  const steps = actions.filter((a) => a.type !== "Learn" && a.type !== "Optimise");

  return (
    <Page wide>
        <Reveal>
          <Link href={`/${locale}/clinician`} className="text-sm text-mist-700 underline-offset-4 hover:underline">
            ← {t("clinician.queueTitle")}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-ink-900">{t("clinician.oneTitle", { name, age: ageFromBirthYear(bundle.user.birthYear) })}</h1>
          </div>
          <p className="mt-1 text-sm text-ink-600">
            {t("clinician.intention")}: {t(`intentions.${bundle.user.intention}`)} ·{" "}
            {t("clinician.consentedSources", { n: bundle.sources.length, total: DATA_SOURCES.length })} · {t("access.consented")}
          </p>
          <p className="surface mt-4 max-w-2xl p-3 text-sm text-ink-600">{t("clinician.oneIntro", { name })}</p>
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Reveal delay={0.05} className="surface-paper p-5">
              <div className="flex flex-wrap gap-2">
                {bundle.results.map((r) => (
                  <div key={r.domain} className="flex items-center gap-2 rounded-md border border-dawn-200 bg-dawn-50 px-3 py-2 text-sm">
                    <span className="text-ink-900">{t(`domains.${r.domain}`)}</span>
                    <DirectionBadge direction={r.direction} confidence={r.confidence} />
                  </div>
                ))}
              </div>
            </Reveal>

            {band ? (
              <Reveal delay={0.1} className="surface-paper p-5">
                <h2 className="text-ink-900">
                  {t("clinician.trend")} · {t(`domains.${chartDomain}`)}
                </h2>
                <div className="mt-3">
                  <ConfidenceBand points={points} band={band} staleMonths={chartDomain === "cycle" ? STALENESS_MONTHS.cycle : STALENESS_MONTHS.lab} nowIso={new Date().toISOString()} />
                </div>
              </Reveal>
            ) : null}

            <Reveal delay={0.15} className="surface-paper p-5">
              <h2 className="text-ink-900">{t("clinician.discussion")}</h2>
              <p className="mt-1 text-xs text-ink-400">{t("clinician.discussionHint")}</p>
              <ul className="mt-3 space-y-3">
                {bundle.results
                  .filter((r) => r.direction !== "Unknown" || r.triggers.length)
                  .map((r) => (
                    <li key={r.domain} className="rounded-md border border-dawn-200 bg-dawn-50 p-3 text-sm">
                      <p className="font-medium text-ink-900">
                        {t(`domains.${r.domain}`)} · {t(`observed.${r.observedKey}`)}
                      </p>
                      <p className="mt-1 text-ink-600">{t(`summaries.${r.summaryKey}`)}</p>
                      {r.triggers.length ? (
                        <p className="mt-1 text-xs text-amber-700">{r.triggers.map((tr) => t(`triggers.${tr}`)).join(" · ")}</p>
                      ) : null}
                    </li>
                  ))}
              </ul>
            </Reveal>

            <Reveal delay={0.2} className="surface-paper p-5">
              <h2 className="text-ink-900">{t("clinician.provenance")}</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {bundle.results.flatMap((r) =>
                  r.drivers.slice(0, 3).map((d, i) => (
                    <li key={`${r.domain}-${d.factor}-${i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dawn-200 bg-dawn-50 px-3 py-2 text-sm">
                      <span className="text-ink-900">
                        {t(`factors.${d.factor}`)} {d.valueLabel ? <span className="text-ink-600">{d.valueLabel}</span> : null}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-ink-400">
                        {d.source ? t(`privacy.sources.${d.source}`) : null}
                        {d.effectiveAt ? ` · ${formatDate(d.effectiveAt, locale)}` : null}
                        <EvidenceChip strength={d.strength} compact />
                      </span>
                    </li>
                  )),
                )}
              </ul>
              <h3 className="mt-5 text-ink-900">{t("clinician.gaps")}</h3>
              <ul className="mt-2 flex flex-wrap gap-2 text-xs">
                {bundle.results.flatMap((r) => r.unknowns).map((u, i) => (
                  <li key={`${u.missing}-${i}`} className="rounded-pill border border-dashed border-slate-400 px-2 py-0.5 text-slate-600">
                    {t(`missing.${u.missing}`)}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <div className="space-y-6">
            <Reveal delay={0.1}>
              <ReviewForm patientId={id} />
            </Reveal>
            <Reveal delay={0.15} className="surface-paper p-5">
              <h2 className="text-ink-900">{t("clinician.referral")}</h2>
              {steps.length ? (
                <ul className="mt-3 space-y-3">
                  {steps.map((a) => (
                    <li key={a.id} className="text-sm">
                      <p className="text-ink-900">{t(`actions.titles.${a.titleKey}`)}</p>
                      <PathStepper state={a.state as ActionState} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-ink-400">—</p>
              )}
            </Reveal>
            <Reveal delay={0.2} className="surface-paper p-5">
              <h2 className="text-ink-900">{t("timeline.title")}</h2>
              <div className="mt-3">
                <HistoryList
                  rows={history.slice(-8).reverse().map((h) => ({
                    id: h.id,
                    domain: h.domain as Domain,
                    direction: h.direction as Direction,
                    confidence: h.confidence as Confidence,
                    computedAt: h.computedAt.toISOString(),
                  }))}
                />
              </div>
            </Reveal>
            <Reveal delay={0.25} className="surface-paper p-5">
              <h2 className="text-ink-900">{t("clinician.reviews")}</h2>
              {reviews.length ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {reviews.map((r) => (
                    <li key={r.id} className="rounded-md border border-dawn-200 bg-dawn-50 px-3 py-2">
                      <p className="text-ink-900">
                        <span className="font-medium">{t(`clinician.${r.decision}`)}</span> · {locale === "ar" ? r.clinician.nameAr : r.clinician.name}
                      </p>
                      {r.reason ? <p className="text-ink-600">{r.reason}</p> : null}
                      {r.note ? <p className="text-ink-600">{r.note}</p> : null}
                      <p className="text-xs text-ink-400">{formatDate(r.createdAt, locale)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-ink-400">{t("clinician.noReviews")}</p>
              )}
            </Reveal>
          </div>
        </div>
    </Page>
  );
}
