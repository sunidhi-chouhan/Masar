import {
  listActions,
  loadPatientBundle,
  reviewsForPatient,
  syncDerived,
  timelineFor,
} from "@/server/patient";
import {
  ageFromBirthYear,
  type ActionState,
  type ActionType,
  type Direction,
  type Domain,
  type DomainResult,
} from "@/lib/domain/types";
import { bandFor } from "@/lib/engine/bands";
import { metabolicBreakdown, MISSING_ADD_PATH } from "@/lib/engine/breakdown";
import { connectionsFor } from "@/lib/engine/connections";
import { pickFeatured } from "@/lib/engine/featured";
import {
  domainFacts,
  measureRows,
  stalenessFor,
} from "@/lib/engine/trajectory";
import { hubsForDomain } from "@/lib/living-well/content";
import { formatDate } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import type { Translator } from "@/lib/i18n/translate";
import { LinkButton, Page, SimulatedBadge } from "@/components/ui/atoms";
import { Reveal } from "@/components/ui/motion";
import { DomainCard } from "@/components/trajectory/domain-card";
import { IntentionPicker } from "@/components/trajectory/intention-picker";
import { MetabolicBreakdown } from "@/components/trajectory/metabolic-breakdown";
import {
  TrajectoryPanel,
  type TrajectoryArea,
} from "@/components/trajectory/trajectory-panel";
import {
  KeyInsights,
  type InsightItem,
} from "@/components/trajectory/key-insights";
import { NextSteps, type NextStep } from "@/components/actions/next-steps";
import type { ActionRow } from "@/components/actions/action-card";
import { hasAiExplanationConsent } from "@/server/consent";
import { paraphraseWithGemini } from "@/server/ai/gemini";

const ACTION_TYPE_ORDER: ActionType[] = [
  "Refer",
  "Counsel",
  "PreserveDiscuss",
  "TestDiscuss",
  "Optimise",
  "Learn",
];
const CLINICAL_TYPES: ActionType[] = [
  "Refer",
  "Counsel",
  "PreserveDiscuss",
  "TestDiscuss",
];
const DIRECTION_PRIORITY: Direction[] = [
  "Discuss",
  "Shifting",
  "Improving",
  "Stable",
  "Unknown",
];
const MIN_CHART_SPAN_DAYS = 7;

function nextStepFor(
  r: DomainResult,
  activeActions: ActionRow[],
  locale: Locale,
  t: Translator,
): { label: string; href: string } {
  const primary =
    (r.domain === "cycle"
      ? r.unknowns.find((u) => u.missing === "cycle_dates")
      : undefined) ?? r.unknowns[0];
  if (r.confidence === "InsufficientData") {
    const first = primary;
    const path = first ? MISSING_ADD_PATH[first.missing] : "/profile";
    return {
      label: first
        ? `${t("trajectory.addData")}: ${t(`missing.${first.missing}`)}`
        : t("dashboard.insights.addRelevant"),
      href: `/${locale}${path ?? "/profile"}`,
    };
  }
  const matched = activeActions.find(
    (a) => a.domain === r.domain && CLINICAL_TYPES.includes(a.type),
  );
  if (matched) {
    return {
      label: `${t(`actions.titles.${matched.titleKey}`)} (${t(`actions.types.${matched.type}`)})`,
      href: `/${locale}#steps`,
    };
  }
  if (primary) {
    const path = MISSING_ADD_PATH[primary.missing] ?? "/profile";
    return {
      label: `${t("trajectory.addData")}: ${t(`missing.${primary.missing}`)}`,
      href: `/${locale}${path}`,
    };
  }
  return {
    label: t("domainDetail.understand"),
    href: `/${locale}/trajectory/${r.domain}`,
  };
}

export async function PatientDashboard({
  userId,
  locale,
  t,
}: {
  userId: string;
  locale: Locale;
  t: Translator;
}) {
  const actor = { userId, role: "patient" as const };
  const now = new Date();
  const nowIso = now.toISOString();
  const bundle = await loadPatientBundle(
    actor,
    userId,
    "PersonalView",
    "trajectory",
  );
  await syncDerived(bundle);

  const [rawActions, reviews] = await Promise.all([
    listActions(userId),
    reviewsForPatient(userId),
  ]);

  const name = locale === "ar" ? bundle.user.nameAr : bundle.user.name;
  const age = ageFromBirthYear(bundle.user.birthYear, now);
  const breakdown = metabolicBreakdown(bundle.observations, now);
  const results = bundle.results;

  const latestObs =
    bundle.observations.length > 0
      ? bundle.observations.reduce((a, b) =>
          a.effectiveAt > b.effectiveAt ? a : b,
        )
      : null;

  /* ---------- care actions ---------- */
  const toRow = (a: (typeof rawActions)[number]): ActionRow => ({
    id: a.id,
    type: a.type as ActionType,
    domain: a.domain as Domain,
    state: a.state as ActionState,
    titleKey: a.titleKey,
    reasonKey: a.reasonKey,
    suggestedAt: a.suggestedAt.toISOString(),
    requestedAt: a.requestedAt?.toISOString() ?? null,
    confirmedAt: a.confirmedAt?.toISOString() ?? null,
    scheduledFor: a.scheduledFor?.toISOString() ?? null,
    attendedAt: a.attendedAt?.toISOString() ?? null,
    outcomeAt: a.outcomeAt?.toISOString() ?? null,
  });
  const liveActions = rawActions
    .filter((a) => !["Declined", "Expired"].includes(a.state))
    .map(toRow)
    .sort(
      (a, b) =>
        ACTION_TYPE_ORDER.indexOf(a.type) - ACTION_TYPE_ORDER.indexOf(b.type),
    );
  const activeActions = liveActions.filter(
    (a) => a.state !== "OutcomeRecorded",
  );
  const clinicalActions = liveActions.filter((a) =>
    CLINICAL_TYPES.includes(a.type),
  );
  const shownActions = clinicalActions.slice(0, 3);

  const hubHrefByDomain: Record<string, string> = {};
  for (const r of results) {
    const hub = hubsForDomain(r.domain)[0];
    hubHrefByDomain[r.domain] = hub
      ? `/${locale}/living-well/${hub.id}`
      : `/${locale}/living-well`;
  }

  /* ---------- trajectory areas ---------- */
  const areas: TrajectoryArea[] = await Promise.all(
    results.map(async (r) => {
      const band = bandFor(r.domain);
      const pts = band
        ? bundle.observations
            .filter((o) => o.code === band.code && o.valueNum !== null)
            .map((o) => ({
              at: o.effectiveAt.toISOString(),
              value: o.valueNum as number,
              source: t(`privacy.sources.${o.dataSourceId}`),
            }))
        : [];
      const span =
        pts.length >= 2
          ? (Math.max(...pts.map((p) => Date.parse(p.at))) -
              Math.min(...pts.map((p) => Date.parse(p.at)))) /
            86_400_000
          : 0;
      return {
        domain: r.domain,
        direction: r.direction,
        confidence: r.confidence,
        rows: measureRows(r.domain, bundle.observations, now),
        chart:
          band && pts.length >= 2 && span >= MIN_CHART_SPAN_DAYS
            ? { points: pts, band, staleMonths: stalenessFor(band.code) }
            : null,
        timeline: await timelineFor(userId, r.domain, now),
        unknowns: r.unknowns.map((u) => ({
          ...u,
          href: `/${locale}${MISSING_ADD_PATH[u.missing] ?? "/profile"}`,
        })),
      };
    }),
  );
  const rank = (a: TrajectoryArea) => DIRECTION_PRIORITY.indexOf(a.direction);
  const byRank = (xs: TrajectoryArea[]) =>
    [...xs].sort((a, b) => rank(a) - rank(b))[0];
  const initial =
    byRank(areas.filter((a) => a.chart)) ??
    byRank(
      areas.filter(
        (a) => a.rows.length > 0 && a.confidence !== "InsufficientData",
      ),
    ) ??
    byRank(areas.filter((a) => a.rows.length > 0)) ??
    areas[0];

  /* ---------- insights, connections, overview ---------- */
  const insightItems: InsightItem[] = results.map((r) => ({
    result: r,
    next: nextStepFor(r, activeActions, locale, t),
  }));
  const connections = connectionsFor(bundle.profile, results);
  const featured = pickFeatured(insightItems);

  let assistedExplanation: string | null = null;
  if (featured && (await hasAiExplanationConsent(userId))) {
    assistedExplanation = await paraphraseWithGemini({
      locale: locale === "ar" ? "ar" : "en",
      domainLabel: t(`domains.${featured.result.domain}`),
      direction: t(`directions.${featured.result.direction}`),
      confidence: t(`confidence.${featured.result.confidence}`),
      observed: t(`observed.${featured.result.observedKey}`),
      summary: t(`summaries.${featured.result.summaryKey}`),
      cannotTell: t(`dashboard.insights.cannotByDomain.${featured.result.domain}`),
    });
  }

  /* ---------- recommended next steps ---------- */
  const flagged = results.filter(
    (r) =>
      r.confidence !== "InsufficientData" &&
      (r.direction === "Discuss" || r.direction === "Shifting"),
  );
  flagged.sort(
    (a, b) =>
      DIRECTION_PRIORITY.indexOf(a.direction) -
      DIRECTION_PRIORITY.indexOf(b.direction),
  );
  const flaggedDomains = new Set(flagged.map((r) => r.domain));

  const seen = new Set<string>();
  const completable = results
    .flatMap((r) => r.unknowns)
    .filter(
      (u) =>
        MISSING_ADD_PATH[u.missing] &&
        !seen.has(u.missing) &&
        seen.add(u.missing),
    )
    .sort(
      (a, b) =>
        Number(flaggedDomains.has(b.wouldNarrow)) -
          Number(flaggedDomains.has(a.wouldNarrow)) ||
        Number(b.missing === "cycle_dates") -
          Number(a.missing === "cycle_dates"),
    );

  const steps: NextStep[] = [];
  if (completable.length > 0) {
    steps.push({
      key: "complete",
      vars: {
        items: completable
          .slice(0, 3)
          .map((u) => t(`missing.${u.missing}`))
          .join("; "),
      },
      href: `/${locale}${MISSING_ADD_PATH[completable[0].missing]}`,
    });
  }
  for (const r of flagged) {
    const d =
      r.drivers.find(
        (x) =>
          x.valueLabel &&
          x.source &&
          x.source !== "SelfReport" &&
          x.factor !== "age",
      ) ?? r.drivers.find((x) => x.valueLabel && x.factor !== "age");
    if (d?.valueLabel) {
      steps.push({
        key: "review",
        vars: {
          factor: t(`factors.${d.factor}`),
          value: d.valueLabel,
          date: d.effectiveAt ? formatDate(d.effectiveAt, locale) : "—",
          area: t(`domains.${r.domain}`),
          direction: t(`directions.${r.direction}`),
        },
        href: `/${locale}/trajectory/${r.domain}`,
      });
      break;
    }
  }
  if (
    flagged.length > 0 ||
    clinicalActions.some((a) => a.state !== "OutcomeRecorded")
  ) {
    steps.push({ key: "prepare", vars: {}, href: `/${locale}/living-well` });
  }
  const learnHub =
    flagged.length > 0 ? hubsForDomain(flagged[0].domain)[0] : undefined;
  if (learnHub) {
    steps.push({
      key: "learn",
      vars: { title: locale === "ar" ? learnHub.titleAr : learnHub.title },
      href: `/${locale}/living-well/${learnHub.id}`,
    });
  }

  /* ---------- overview: what we know so far ---------- */
  const factsByDomain = Object.fromEntries(
    results.map((r) => [r.domain, domainFacts(r.domain, bundle.observations, bundle.profile, now)]),
  ) as Record<Domain, ReturnType<typeof domainFacts>>;
  const withInfo = results
    .filter((r) => factsByDomain[r.domain].total > 0)
    .map((r) => t(`domains.${r.domain}`));
  const withoutInfo = results
    .filter((r) => factsByDomain[r.domain].total === 0)
    .map((r) => t(`domains.${r.domain}`));
  const missingItems = completable
    .slice(0, 3)
    .map((u) => t(`missing.${u.missing}`));

  const resultOf = (d: Domain) => results.findIndex((r) => r.domain === d);
  const card = (d: Domain) => {
    const i = resultOf(d);
    if (i < 0) return null; // area not applicable to this person (e.g. male-factor for a woman)
    return (
      <DomainCard
        key={d}
        result={results[i]}
        facts={factsByDomain[d]}
        next={insightItems[i].next}
        breakdown={d === "metabolic" ? breakdown : null}
      />
    );
  };
  const groups: {
    key: "reproductive" | "history" | "context";
    domains: Domain[];
  }[] = [
    { key: "reproductive", domains: ["cycle", "reserve", "male"] },
    { key: "history", domains: ["conditions"] },
    { key: "context", domains: ["metabolic", "lifestyle"] },
  ];

  return (
    <Page wide>
      <Reveal>
        <header className="border-b border-dawn-200 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="label-caps">{t("dashboard.eyebrow")}</p>
            <SimulatedBadge />
          </div>
          <h1 className="mt-2 max-w-3xl text-ink-900">{t("dashboard.headline")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600 md:text-[0.95rem]">{t("dashboard.subheadline")}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <LinkButton href={`/${locale}/profile`} tone="primary">
              {t("trajectory.addData")}
            </LinkButton>
            <LinkButton href={`/${locale}/privacy`} tone="ghost">
              {t("nav.privacy")}
            </LinkButton>
          </div>
        </header>
      </Reveal>

      <Reveal delay={0.06}>
        <section id="overview" className="mt-7 scroll-mt-20" aria-labelledby="overview-heading">
          <div className="surface-paper grid gap-0 overflow-hidden lg:grid-cols-[1.2fr_1fr]">
            <div className="p-4 md:p-5">
              <h2 id="overview-heading" className="text-ink-900">
                {t("dashboard.overview.title")}
              </h2>
              <p className="mt-1.5 text-sm font-medium text-ink-900">
                {name}{" "}
                <span className="font-normal text-ink-600">
                  · {t("common.age", { age })}
                </span>
                {bundle.profile.conditions.length > 0 ? (
                  <span className="font-normal text-ink-600">
                    {" "}
                    · {bundle.profile.conditions.map((c) => t(`factors.${c}`)).join(", ")}
                  </span>
                ) : null}
              </p>
              <div className="mt-3 space-y-1.5 text-sm text-ink-600">
                <p>
                  {latestObs
                    ? t("dashboard.overview.summary", {
                        n: bundle.observations.length,
                        sources: bundle.sources.length,
                        date: formatDate(latestObs.effectiveAt, locale),
                      })
                    : t("dashboard.overview.summaryNone")}
                </p>
                {withInfo.length > 0 ? (
                  <p>{t("dashboard.overview.withInfo", { areas: withInfo.join(", ") })}</p>
                ) : null}
                {withoutInfo.length > 0 ? (
                  <p>{t("dashboard.overview.noInfo", { areas: withoutInfo.join(", ") })}</p>
                ) : null}
                {missingItems.length > 0 ? (
                  <p className="rounded-md border border-dashed border-dawn-300 bg-dawn-50/80 px-3 py-2 text-ink-600">
                    {t("dashboard.overview.missing", { items: missingItems.join("; ") })}
                  </p>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-ink-400">{t("dashboard.context.syntheticNotice")}</p>
            </div>

            <div className="border-t border-dawn-200 bg-mist-100/35 p-4 md:border-t-0 md:border-s md:p-5">
              <p className="label-caps">{t("dashboard.overview.goal")}</p>
              <div className="mt-1.5">
                <IntentionPicker current={bundle.user.intention} />
              </div>
              <p className="mt-3 text-sm text-ink-600">
                {t(`dashboard.overview.goalBody.${bundle.user.intention}`)}
              </p>
              <p className="mt-3 border-t border-dawn-200/80 pt-3 text-xs text-ink-600">
                {t("dashboard.overview.relevanceNote")}
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <div className="mt-9 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal delay={0.1} className="min-w-0">
          <section id="trajectory" className="scroll-mt-20" aria-labelledby="trajectory-heading">
            <div className="mb-3">
              <h2 id="trajectory-heading" className="text-ink-900">
                {t("dashboard.trajectory.title")}
              </h2>
              <p className="mt-1 text-sm text-ink-600">{t("dashboard.trajectory.subtitle")}</p>
            </div>
            <TrajectoryPanel areas={areas} initialDomain={initial.domain} nowIso={nowIso} />
          </section>
        </Reveal>

        <div className="space-y-8">
          <Reveal delay={0.14}>
            <section id="insights" className="scroll-mt-20" aria-labelledby="insights-heading">
              <div className="mb-3">
                <h2 id="insights-heading" className="text-ink-900">
                  {t("dashboard.insights.title")}
                </h2>
                <p className="mt-1 text-sm text-ink-600">{t("dashboard.insights.subtitle")}</p>
              </div>
              <KeyInsights
                items={insightItems}
                connections={connections}
                assistedExplanation={assistedExplanation}
              />
            </section>
          </Reveal>

          <Reveal delay={0.18}>
            <section id="steps" className="scroll-mt-20" aria-labelledby="steps-heading">
              <div className="mb-3">
                <h2 id="steps-heading" className="text-ink-900">
                  {t("dashboard.steps.title")}
                </h2>
                <p className="mt-1 text-sm text-ink-600">{t("dashboard.steps.subtitle")}</p>
              </div>
              <NextSteps
                steps={steps}
                actions={shownActions}
                featuredDomain={featured?.result.domain ?? null}
                hubHrefByDomain={hubHrefByDomain}
                reviews={reviews}
                moreCount={Math.max(0, liveActions.length - shownActions.length)}
                actionsHref={`/${locale}/actions`}
              />
            </section>
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.22}>
        <section id="details" className="mt-9 scroll-mt-20" aria-labelledby="details-heading">
          <details className="group surface-paper">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg p-4 md:p-5 [&::-webkit-details-marker]:hidden">
              <span>
                <span id="details-heading" className="block text-lg font-semibold text-ink-900">
                  {t("dashboard.details.title")}
                </span>
                <span className="mt-0.5 block text-sm text-ink-600">{t("dashboard.details.subtitle")}</span>
              </span>
              <span className="shrink-0 text-sm font-medium text-mist-700">
                {t("dashboard.details.toggle")}{" "}
                <span aria-hidden className="inline-block transition-transform group-open:rotate-180">
                  ⌄
                </span>
              </span>
            </summary>
            <div className="space-y-8 border-t border-dawn-200 p-4 md:p-5">
              {groups
                .filter((g) => g.domains.some((d) => resultOf(d) >= 0))
                .map((g) => (
                  <div key={g.key}>
                    <h3 className="text-ink-900">{t(`dashboard.details.groups.${g.key}.title`)}</h3>
                    <p className="mt-1 mb-3 max-w-2xl text-sm text-ink-600">
                      {t(`dashboard.details.groups.${g.key}.body`)}
                    </p>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{g.domains.map(card)}</div>
                    {g.key === "context" ? (
                      <div className="mt-4">
                        <MetabolicBreakdown categories={breakdown} compactHeader />
                      </div>
                    ) : null}
                  </div>
                ))}
              <p className="border-t border-dawn-200 pt-4 text-xs text-ink-600">
                <LinkButton href={`/${locale}/import`} tone="ghost">
                  {t("import.title")}
                </LinkButton>
              </p>
            </div>
          </details>
        </section>
      </Reveal>

      <p className="mt-8 border-t border-dawn-200 pt-4 text-xs text-ink-600">{t("common.notDiagnosis")}</p>
    </Page>
  );
}
