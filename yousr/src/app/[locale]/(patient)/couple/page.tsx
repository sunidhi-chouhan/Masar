import { requireRole } from "@/lib/page-context";
import { coupleFor } from "@/server/couple";
import { authorize } from "@/lib/consent/authorize";
import { loadPatientBundle } from "@/server/patient";
import { domainsFor, type Sex } from "@/lib/domain/types";
import { GlowField, Page } from "@/components/ui/atoms";
import { Reveal } from "@/components/ui/motion";
import { CouplePanel, type PartnerView } from "@/components/couple/couple-panel";

export default async function CouplePage({ params }: PageProps<"/[locale]/couple">) {
  const { locale, t, session } = await requireRole(params, ["patient"]);
  const link = await coupleFor(session.userId);
  const actor = { userId: session.userId, role: session.role };

  let partnerShares: PartnerView[] = [];
  let partnerSharingOn = false;
  if (link) {
    const decision = await authorize({ actor, subjectId: link.partner.id, purpose: "PartnerShare", resource: "couple", silent: true });
    partnerSharingOn = decision.allowed;
    if (decision.allowed) {
      // Same gate, same purpose: the View is logged on the partner's ledger.
      // Only the domains they scoped are kept, and only as directions.
      const partnerBundle = await loadPatientBundle(actor, link.partner.id, "PartnerShare", "couple:partner");
      partnerShares = partnerBundle.results
        .filter((r) => (decision.scopes ?? []).includes(r.domain))
        .map((r) => ({ domain: r.domain, direction: r.direction, confidence: r.confidence }));
    }
  }

  return (
    <div className="relative overflow-hidden">
      <GlowField variant="amber" />
      <Page wide>
        <Reveal>
          <h1 className="text-ink-900">{t("couple.title")}</h1>
          <p className="mt-2 max-w-2xl text-ink-600">{t("couple.subtitle")}</p>
        </Reveal>
        <Reveal delay={0.1} className="mt-8">
          {link ? (
            <CouplePanel
              myDomains={domainsFor(link.me.sex as Sex)}
              myScopes={link.myScopes}
              partnerName={locale === "ar" ? link.partner.nameAr : link.partner.name}
              partnerShares={partnerShares}
              partnerSharingOn={partnerSharingOn}
              partnerHue={link.partner.hue}
            />
          ) : (
            <p className="text-ink-600">{t("couple.notLinked")}</p>
          )}
        </Reveal>
      </Page>
    </div>
  );
}
