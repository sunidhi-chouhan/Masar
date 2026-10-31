import { requireRole } from "@/lib/page-context";
import { getConsentState } from "@/server/consent";
import { listAuditForSubject } from "@/server/audit";
import { coupleFor } from "@/server/couple";
import { ConsentCentre } from "@/components/privacy/consent-centre";
import { AccessLog } from "@/components/privacy/access-log";
import { Page } from "@/components/ui/atoms";
import { Reveal } from "@/components/ui/motion";
import { PageHero } from "@/components/layout/page-hero";
import { GroupConstellation } from "@/components/trajectory/section-figures";

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { t, session } = await requireRole(params, ["patient"]);
  const [state, audit, couple] = await Promise.all([
    getConsentState(session.userId),
    listAuditForSubject(session.userId, 60),
    coupleFor(session.userId),
  ]);

  return (
    <div className="relative overflow-hidden">
      <Page wide>
        <PageHero
          title={t("privacy.title")}
          subtitle={t("privacy.subtitle")}
          tier="DecisionSupport"
          figure={<GroupConstellation groupKey="history" />}
        />
        <Reveal delay={0.05} className="mt-5 grid gap-3 sm:grid-cols-2">
          <p className="flex gap-3 overflow-hidden rounded-[1.25rem] bg-white p-4 text-sm text-ink-600 shadow-[var(--shadow-soft)]">
            <span aria-hidden className="mt-1 h-2.5 w-2.5 shrink-0 rounded-pill bg-amber-400" />
            {t("privacy.story1")}
          </p>
          <p className="flex gap-3 overflow-hidden rounded-[1.25rem] bg-white p-4 text-sm text-ink-600 shadow-[var(--shadow-soft)]">
            <span aria-hidden className="mt-1 h-2.5 w-2.5 shrink-0 rounded-pill bg-mist-500" />
            {t("privacy.story2")}
          </p>
        </Reveal>
        <Reveal delay={0.1} className="mt-10">
          <ConsentCentre state={state} hasPartner={Boolean(couple)} />
        </Reveal>
        <Reveal delay={0.2} className="mt-12">
          <h2 className="font-display text-2xl tracking-tight text-ink-900">{t("privacy.accessLog")}</h2>
          <p className="mb-4 mt-1 text-sm text-ink-600">{t("privacy.accessLogBody")}</p>
          <AccessLog
            rows={audit.map((a) => ({
              id: a.id,
              type: a.type,
              resource: a.resource,
              detail: a.detail,
              allowed: a.allowed,
              createdAt: a.createdAt.toISOString(),
              actorName: a.actor?.name ?? null,
              actorNameAr: a.actor?.nameAr ?? null,
              actorRole: a.actorRole,
            }))}
          />
        </Reveal>
      </Page>
    </div>
  );
}
