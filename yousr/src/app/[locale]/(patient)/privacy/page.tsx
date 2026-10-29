import { requireRole } from "@/lib/page-context";
import { getConsentState } from "@/server/consent";
import { listAuditForSubject } from "@/server/audit";
import { coupleFor } from "@/server/couple";
import { ConsentCentre } from "@/components/privacy/consent-centre";
import { AccessLog } from "@/components/privacy/access-log";
import { GlowField, Page } from "@/components/ui/atoms";
import { Reveal } from "@/components/ui/motion";

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { t, session } = await requireRole(params, ["patient"]);
  const [state, audit, couple] = await Promise.all([
    getConsentState(session.userId),
    listAuditForSubject(session.userId, 60),
    coupleFor(session.userId),
  ]);

  return (
    <div className="relative overflow-hidden">
      <GlowField variant="amber" />
      <Page>
        <Reveal>
          <h1 className="text-ink-900">{t("privacy.title")}</h1>
          <p className="mt-2 text-ink-600">{t("privacy.subtitle")}</p>
          <div className="surface mt-5 grid gap-2 p-4 text-sm text-ink-600 sm:grid-cols-2">
            <p className="flex gap-2">
              <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-pill bg-amber-400" />
              {t("privacy.story1")}
            </p>
            <p className="flex gap-2">
              <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-pill bg-mist-500" />
              {t("privacy.story2")}
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="mt-10">
          <ConsentCentre state={state} hasPartner={Boolean(couple)} />
        </Reveal>
        <Reveal delay={0.2} className="mt-12">
          <h2 className="text-ink-900">{t("privacy.accessLog")}</h2>
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
