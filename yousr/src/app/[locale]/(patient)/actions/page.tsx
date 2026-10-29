import Link from "next/link";
import { requireRole } from "@/lib/page-context";
import { listActions, loadPatientBundle, syncDerived } from "@/server/patient";
import type { ActionState, ActionType, Domain } from "@/lib/domain/types";
import { hubsForDomain } from "@/lib/living-well/content";
import { Page, SectionHeading } from "@/components/ui/atoms";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { ActionCard, type ActionRow } from "@/components/actions/action-card";

const TYPE_ORDER: ActionType[] = ["Refer", "Counsel", "PreserveDiscuss", "TestDiscuss", "Optimise", "Learn"];

const SEQUENCE: { key: string; href: string | null }[] = [
  { key: "understand", href: "/trajectory" },
  { key: "learn", href: "/living-well" },
  { key: "ask", href: null },
  { key: "clinician", href: "/privacy" },
];

export default async function ActionsPage({ params }: PageProps<"/[locale]/actions">) {
  const { locale, t, session } = await requireRole(params, ["patient"]);
  const bundle = await loadPatientBundle({ userId: session.userId, role: session.role }, session.userId, "PersonalView", "actions");
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

  const active = rows.filter((a) => !["Declined", "Expired", "OutcomeRecorded"].includes(a.state)).map(toRow);
  const closed = rows.filter((a) => ["Declined", "Expired", "OutcomeRecorded"].includes(a.state)).map(toRow);
  active.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));
  const hubHref = (d: Domain) => {
    const hub = hubsForDomain(d)[0];
    return hub ? `/${locale}/living-well/${hub.id}` : `/${locale}/living-well`;
  };

  return (
    <div className="relative overflow-hidden">
      <Page wide>
        <Reveal>
          <h1 className="text-ink-900">{t("actions.title")}</h1>
          <p className="mt-2 max-w-2xl text-ink-600">{t("actions.subtitle")}</p>
          <p className="mt-1 text-xs text-ink-400">
            {t("trajectory.intentionLabel", { intention: t(`intentions.${bundle.user.intention}`) })} · {t("actions.clinicianPreference")}
          </p>
        </Reveal>

        <Reveal delay={0.05} className="surface mt-6 p-4">
          <p className="font-display text-lg text-ink-900">{t("actions.sequence.title")}</p>
          <p className="text-sm text-ink-600">{t("actions.sequence.body")}</p>
          <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SEQUENCE.map((s, i) => (
              <li key={s.key} className="relative flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-dawn-200 font-display text-sm text-ink-900">{i + 1}</span>
                <div className="min-w-0">
                  {s.href ? (
                    <Link href={`/${locale}${s.href}`} className="text-sm font-medium text-ink-900 underline-offset-4 hover:underline">
                      {t(`actions.sequence.${s.key}.title`)}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-ink-900">{t(`actions.sequence.${s.key}.title`)}</p>
                  )}
                  <p className="text-xs text-ink-600">{t(`actions.sequence.${s.key}.body`)}</p>
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
          <p className="mt-8 text-ink-600">{t("actions.empty")}</p>
        )}

        {closed.length ? (
          <Reveal delay={0.2} className="mt-12">
            <SectionHeading title={t("actions.trackerTitle")} />
            <ul className="divide-y divide-dawn-200 rounded-lg border border-dawn-200 bg-dawn-50/60">
              {closed.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span className="text-ink-900">{t(`actions.titles.${a.titleKey}`)}</span>
                  <span className="text-xs text-ink-400">{t(`actions.states.${a.state}`)}</span>
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
