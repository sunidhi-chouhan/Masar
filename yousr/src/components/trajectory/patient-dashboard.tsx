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
  type Intention,
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
import { LinkButton, Page } from "@/components/ui/atoms";
import { Reveal } from "@/components/ui/motion";
import { DomainCard } from "@/components/trajectory/domain-card";
import {
  DashboardHero,
  type AreaTile,
  type HeroNextAction,
} from "@/components/trajectory/dashboard-hero";
import { DetailsGroup } from "@/components/trajectory/details-groups";
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
import { paraphraseWithClaude } from "@/server/ai/claude";

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
const PATHWAY_STATES: ActionState[] = ["Suggested", "Requested", "Confirmed", "Attended", "OutcomeRecorded"];

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
    assistedExplanation = await paraphraseWithClaude({
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

  const resultOf = (d: Domain) => results.findIndex((r) => r.domain === d);
  const sparkFor = (d: Domain) => {
    const area = areas.find((a) => a.domain === d);
    return area?.chart?.points ?? [];
  };
  const card = (d: Domain) => {
    const i = resultOf(d);
    if (i < 0) return null;
    return (
      <DomainCard
        key={d}
        result={results[i]}
        facts={factsByDomain[d]}
        next={insightItems[i].next}
        breakdown={d === "metabolic" ? breakdown : null}
        sparkPoints={sparkFor(d)}
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

  const areasKnown = results.filter((r) => factsByDomain[r.domain].total > 0).length;
  const tiles: AreaTile[] = results.map((r) => ({
    domain: r.domain,
    direction: r.direction,
    confidence: r.confidence,
    readings: factsByDomain[r.domain].total,
    points: sparkFor(r.domain),
  }));
  const watch = flagged.map((r) => ({ domain: r.domain, direction: r.direction }));
  const focusAction = clinicalActions.find((a) => a.state !== "OutcomeRecorded");
  const stepIndex = focusAction ? PATHWAY_STATES.indexOf(focusAction.state) + 1 : 0;
  const nextAction: HeroNextAction | null = focusAction
    ? {
        title: t(`actions.titles.${focusAction.titleKey}`),
        typeLabel: t(`actions.types.${focusAction.type}`),
        state: focusAction.state,
        stateLabel: t(`actions.states.${focusAction.state}`),
        stepIndex: Math.max(stepIndex, 1),
        stepTotal: PATHWAY_STATES.length,
        scheduledLabel: focusAction.scheduledFor
          ? t("dashboard.summary.scheduled", { date: formatDate(focusAction.scheduledFor, locale) })
          : null,
      }
    : null;
  const missingLinks = completable.slice(0, 3).map((u) => ({
    label: t(`missing.${u.missing}`),
    href: `/${locale}${MISSING_ADD_PATH[u.missing]}`,
  }));
  const conditionsLabel =
    bundle.profile.conditions.length > 0
      ? bundle.profile.conditions.map((c) => t(`factors.${c}`)).join(", ")
      : null;

  return (
    <Page wide>
      <Reveal>
        <DashboardHero
          name={name}
          age={age}
          intention={bundle.user.intention as Intention}
          intentionLabel={t(`intentions.${bundle.user.intention}`)}
          conditionsLabel={conditionsLabel}
          latestLabel={latestObs ? formatDate(latestObs.effectiveAt, locale) : null}
          readings={bundle.observations.length}
          areasKnown={areasKnown}
          watch={watch}
          nextAction={nextAction}
          missing={missingLinks}
          tiles={tiles}
        />
      </Reveal>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <Reveal delay={0.1} className="min-w-0">
          <section id="trajectory" className="scroll-mt-20" aria-labelledby="trajectory-heading">
            <div className="mb-4">
              <h2 id="trajectory-heading" className="font-display text-2xl tracking-tight text-ink-900">
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
              <div className="mb-4">
                <h2 id="insights-heading" className="font-display text-xl tracking-tight text-ink-900">
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
              <div className="mb-4">
                <h2 id="steps-heading" className="font-display text-xl tracking-tight text-ink-900">
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
        <section id="details" className="mt-12 scroll-mt-20" aria-labelledby="details-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="details-heading" className="font-display text-2xl tracking-tight text-ink-900">
                {t("dashboard.details.title")}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-600">{t("dashboard.details.subtitle")}</p>
            </div>
            <LinkButton href={`/${locale}/import`} tone="ghost">
              {t("import.title")}
            </LinkButton>
          </div>
          <div className="space-y-6">
            {groups
              .filter((g) => g.domains.some((d) => resultOf(d) >= 0))
              .map((g) => (
                <DetailsGroup
                  key={g.key}
                  groupKey={g.key}
                  footer={
                    g.key === "context" ? (
                      <MetabolicBreakdown categories={breakdown} compactHeader />
                    ) : null
                  }
                >
                  {g.domains.map(card)}
                </DetailsGroup>
              ))}
          </div>
        </section>
      </Reveal>

      <p className="mt-10 border-t border-dawn-200 pt-4 text-xs text-ink-600">{t("common.notDiagnosis")}</p>
    </Page>
  );
}
