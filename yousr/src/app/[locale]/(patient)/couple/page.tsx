import { requireRole } from "@/lib/page-context";
import { coupleFor } from "@/server/couple";
import { authorize } from "@/lib/consent/authorize";
import { loadPatientBundle } from "@/server/patient";
import { domainsFor, type Sex } from "@/lib/domain/types";
import { Page } from "@/components/ui/atoms";
import { Reveal } from "@/components/ui/motion";
import { PageHero } from "@/components/layout/page-hero";
import { CouplePanel, type PartnerView } from "@/components/couple/couple-panel";
import { InsightHalo } from "@/components/trajectory/section-figures";

export default async function CouplePage({ params }: PageProps<"/[locale]/couple">) {
  const { locale, t, session } = await requireRole(params, ["patient"]);
  const link = await coupleFor(session.userId);
  const actor = { userId: session.userId, role: session.role };

  let partnerShares: PartnerView[] = [];
  let partnerSharingOn = false;
  if (link) {
    const decision = await authorize({
      actor,
      subjectId: link.partner.id,
      purpose: "PartnerShare",
      resource: "couple",
      silent: true,
    });
    partnerSharingOn = decision.allowed;
    if (decision.allowed) {
      const partnerBundle = await loadPatientBundle(
        actor,
        link.partner.id,
        "PartnerShare",
        "couple:partner",
      );
      partnerShares = partnerBundle.results
        .filter((r) => (decision.scopes ?? []).includes(r.domain))
        .map((r) => ({
          domain: r.domain,
          direction: r.direction,
          confidence: r.confidence,
        }));
    }
  }

  return (
    <div className="relative overflow-hidden">
      <Page wide>
        <PageHero
          title={t("couple.title")}
          subtitle={t("couple.subtitle")}
          tier="DecisionSupport"
          figure={<InsightHalo direction="Stable" />}
        />
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
            <div className="overflow-hidden rounded-[1.75rem] border border-dashed border-dawn-300 bg-dawn-50/70 p-8 text-center">
              <InsightHalo direction="Unknown" className="mx-auto" />
              <p className="mt-4 text-ink-600">{t("couple.notLinked")}</p>
            </div>
          )}
        </Reveal>
      </Page>
    </div>
  );
}
