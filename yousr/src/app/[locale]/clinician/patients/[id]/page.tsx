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
          <Link
            href={`/${locale}/clinician`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 transition-colors hover:text-mist-700"
          >
            <span aria-hidden className="rtl:-scale-x-100">←</span> {t("clinician.queueTitle")}
          </Link>
          <div className="surface-pine mt-4 p-6 md:p-7">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12 text-lg font-semibold text-white ring-1 ring-inset ring-white/20">
                {bundle.user.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")}
              </span>
              <div className="min-w-0">
                <h1 className="text-[clamp(1.75rem,3vw,2.4rem)] leading-tight text-white">
                  {t("clinician.oneTitle", { name, age: ageFromBirthYear(bundle.user.birthYear) })}
                </h1>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[12.5px]">
                  {[
                    `${t("clinician.intention")}: ${t(`intentions.${bundle.user.intention}`)}`,
                    t("clinician.consentedSources", { n: bundle.sources.length, total: DATA_SOURCES.length }),
                  ].map((chip) => (
                    <span key={chip} className="rounded-full bg-white/10 px-2.5 py-0.5 text-white/85 ring-1 ring-inset ring-white/15">
                      {chip}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 font-medium text-mist-700">
                    <span aria-hidden className="dot bg-mist-500" />
                    {t("access.consented")}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-3xl border-t border-white/10 pt-4 text-sm leading-relaxed text-white/70">
              {t("clinician.oneIntro", { name })}
            </p>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <Reveal delay={0.05}>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {bundle.results.map((r) => (
                  <li key={r.domain} className="card flex flex-col gap-3 p-4">
                    <p className="text-[13.5px] font-semibold text-ink-900">{t(`domains.${r.domain}`)}</p>
                    <div>
                      <DirectionBadge direction={r.direction} confidence={r.confidence} compact />
                    </div>
                    <p className="mt-auto border-t border-dawn-200/70 pt-2.5 text-[12px] text-ink-500">
                      {t(`confidence.${r.confidence}`)}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>

            {band ? (
              <Reveal delay={0.1} className="card p-6">
                <h2 className="text-[1.3rem] text-ink-900">
                  {t("clinician.trend")} · {t(`domains.${chartDomain}`)}
                </h2>
                <div className="mt-3">
                  <ConfidenceBand points={points} band={band} staleMonths={chartDomain === "cycle" ? STALENESS_MONTHS.cycle : STALENESS_MONTHS.lab} nowIso={new Date().toISOString()} />
                </div>
              </Reveal>
            ) : null}

            <Reveal delay={0.15} className="card p-6">
              <h2 className="text-[1.3rem] text-ink-900">{t("clinician.discussion")}</h2>
              <p className="mt-1 text-xs text-ink-400">{t("clinician.discussionHint")}</p>
              <ul className="mt-3 space-y-3">
                {bundle.results
                  .filter((r) => r.direction !== "Unknown" || r.triggers.length)
                  .map((r) => (
                    <li key={r.domain} className="rounded-xl border border-dawn-200/80 bg-dawn-50/60 p-4 text-sm">
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

            <Reveal delay={0.2} className="card p-6">
              <h2 className="text-[1.3rem] text-ink-900">{t("clinician.provenance")}</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {bundle.results.flatMap((r) =>
                  r.drivers.slice(0, 3).map((d, i) => (
                    <li key={`${r.domain}-${d.factor}-${i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dawn-200/80 bg-dawn-50/60 px-3 py-2.5 text-sm">
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
            <Reveal delay={0.15} className="card p-6">
              <h2 className="text-[1.3rem] text-ink-900">{t("clinician.referral")}</h2>
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
            <Reveal delay={0.2} className="card p-6">
              <h2 className="text-[1.3rem] text-ink-900">{t("timeline.title")}</h2>
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
            <Reveal delay={0.25} className="card p-6">
              <h2 className="text-[1.3rem] text-ink-900">{t("clinician.reviews")}</h2>
              {reviews.length ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {reviews.map((r) => (
                    <li key={r.id} className="rounded-xl border border-dawn-200/80 bg-dawn-50/60 px-3 py-2.5">
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
