import Link from "next/link";
import { requireRole } from "@/lib/page-context";
import { listActions, loadPatientBundle, syncDerived } from "@/server/patient";
import type { ActionState, ActionType, Domain } from "@/lib/domain/types";
import { hubsForDomain } from "@/lib/living-well/content";
import { Page, SectionHeading } from "@/components/ui/atoms";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { PageHero } from "@/components/layout/page-hero";
import { ActionCard, type ActionRow } from "@/components/actions/action-card";
import { ChronoOrbit } from "@/components/trajectory/section-figures";

const TYPE_ORDER: ActionType[] = ["Refer", "Counsel", "PreserveDiscuss", "TestDiscuss", "Optimise", "Learn"];

const SEQUENCE: { key: string; href: string | null }[] = [
  { key: "understand", href: "/trajectory" },
  { key: "learn", href: "/living-well" },
  { key: "ask", href: null },
  { key: "clinician", href: "/privacy" },
];

export default async function ActionsPage({ params }: PageProps<"/[locale]/actions">) {
  const { locale, t, session } = await requireRole(params, ["patient"]);
  const bundle = await loadPatientBundle(
    { userId: session.userId, role: session.role },
    session.userId,
    "PersonalView",
    "actions",
  );
  await syncDerived(bundle);
  const rows = await listActions(session.userId);

  const toRow = (a: (typeof rows)[number]): ActionRow => ({
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

  const active = rows
    .filter((a) => !["Declined", "Expired", "OutcomeRecorded"].includes(a.state))
    .map(toRow);
  const closed = rows
    .filter((a) => ["Declined", "Expired", "OutcomeRecorded"].includes(a.state))
    .map(toRow);
  active.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));
  const hubHref = (d: Domain) => {
    const hub = hubsForDomain(d)[0];
    return hub ? `/${locale}/living-well/${hub.id}` : `/${locale}/living-well`;
  };

  return (
    <div className="relative overflow-hidden">
      <Page wide>
        <PageHero
          title={t("actions.title")}
          subtitle={t("actions.subtitle")}
          tier="DecisionSupport"
          figure={<ChronoOrbit readingCount={active.length || 1} hasChart={active.length > 0} />}
          actions={
            <p className="text-xs text-ink-500">
              {t("trajectory.intentionLabel", {
                intention: t(`intentions.${bundle.user.intention}`),
              })}{" "}
              · {t("actions.clinicianPreference")}
            </p>
          }
        />

        <Reveal delay={0.05} className="mt-6 overflow-hidden card p-5 md:p-6">
          <p className="font-display text-xl tracking-tight text-ink-900">{t("actions.sequence.title")}</p>
          <p className="mt-1 text-sm text-ink-600">{t("actions.sequence.body")}</p>
          <ol className="relative mt-5 space-y-0 border-s-2 border-dawn-200 ms-3 ps-5 md:ms-4">
            {SEQUENCE.map((s, i) => (
              <li key={s.key} className="relative pb-5 last:pb-0">
                <span
                  aria-hidden
                  className="absolute -start-[1.55rem] top-0.5 flex h-6 w-6 items-center justify-center rounded-pill bg-mist-700 text-[11px] font-bold text-white"
                >
                  {i + 1}
                </span>
                <div className="rounded-2xl bg-white/80 px-3.5 py-3 shadow-[var(--shadow-soft)] ring-1 ring-dawn-200/50">
                  {s.href ? (
                    <Link
                      href={`/${locale}${s.href}`}
                      className="text-sm font-semibold text-ink-900 underline-offset-4 hover:underline"
                    >
                      {t(`actions.sequence.${s.key}.title`)}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-ink-900">{t(`actions.sequence.${s.key}.title`)}</p>
                  )}
                  <p className="mt-0.5 text-xs text-ink-600">{t(`actions.sequence.${s.key}.body`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        {active.length ? (
          <Stagger className="mt-8 grid gap-4 md:grid-cols-2">
            {active.map((a) => (
              <StaggerItem key={a.id}>
                <ActionCard action={a} livingWellHref={hubHref(a.domain)} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <Reveal delay={0.1} className="mt-8">
            <div className="flex flex-col items-center gap-4 overflow-hidden rounded-[18px] border border-dashed border-dawn-300 bg-dawn-50/60 px-6 py-10 text-center">
              <ChronoOrbit readingCount={0} />
              <div>
                <p className="font-display text-lg text-ink-900">{t("actions.empty")}</p>
                <Link
                  href={`/${locale}/trajectory`}
                  className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-mist-700 px-4 text-sm font-semibold text-white hover:bg-mist-500"
                >
                  {t("nav.trajectory")} →
                </Link>
              </div>
            </div>
          </Reveal>
        )}

        {closed.length ? (
          <Reveal delay={0.2} className="mt-12">
            <SectionHeading title={t("actions.trackerTitle")} />
            <ul className="mt-3 divide-y divide-dawn-200 overflow-hidden rounded-[1.25rem] bg-white shadow-[var(--shadow-soft)]">
              {closed.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 text-sm">
                  <span className="font-medium text-ink-900">{t(`actions.titles.${a.titleKey}`)}</span>
                  <span className="rounded-full bg-dawn-100 px-2.5 py-0.5 text-xs text-ink-500">
                    {t(`actions.states.${a.state}`)}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}
        <p className="mt-10 text-xs text-ink-400">{t("common.notDiagnosis")}</p>
      </Page>
    </div>
  );
}
