import { pageContext } from "@/lib/page-context";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { RULE_DOCS, TRIGGERS } from "@/lib/engine/rules";
import { EVIDENCE } from "@/lib/evidence/library";
import { EvidenceChip, GlowField, Page, TierRibbon } from "@/components/ui/atoms";
import { Reveal } from "@/components/ui/motion";
import { formatDate } from "@/lib/i18n/format";

export default async function HowItWorksPage({ params }: PageProps<"/[locale]/about/how-it-works">) {
  const { locale, t } = await pageContext(params);
  const dict = getDictionary(locale);
  const about = dict.about as { refused?: unknown } | undefined;
  const refused = Array.isArray(about?.refused) ? (about.refused as string[]) : [];
  const grouped = new Map<string, typeof RULE_DOCS>();
  for (const r of RULE_DOCS) grouped.set(r.domain, [...(grouped.get(r.domain) ?? []), r]);

  return (
    <div className="relative overflow-hidden">
      <GlowField variant="mist" />
      <Page wide>
        <Reveal>
          <h1 className="text-ink-900">{t("about.title")}</h1>
          <p className="mt-2 max-w-2xl text-ink-600">{t("about.subtitle")}</p>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Reveal delay={0.05}>
            <h2 className="text-ink-900">{t("about.rulesTitle")}</h2>
            <div className="mt-4 space-y-5">
              {[...grouped.entries()].map(([domain, rules]) => (
                <section key={domain} className="surface-paper p-5">
                  <p className="label-caps mb-2">{domain === "all" ? t("common.appName") : t(`domains.${domain}`)}</p>
                  <ul className="space-y-2">
                    {rules.map((r) => (
                      <li key={r.id} className="flex gap-3 text-sm">
                        <span className="w-8 shrink-0 font-display text-ink-400">{r.id}</span>
                        <span className="text-ink-900">{t(`rules.${r.i18nKey}`)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </Reveal>

          <div className="space-y-8">
            <Reveal delay={0.1}>
              <h2 className="text-ink-900">{t("about.triggersTitle")}</h2>
              <ul className="mt-4 space-y-2">
                {Object.values(TRIGGERS).map((id) => (
                  <li key={id} className="flex items-center justify-between gap-3 rounded-md border border-amber-400/40 bg-amber-100/40 px-3 py-2 text-sm">
                    <span className="text-ink-900">{t(`triggers.${id}`)}</span>
                    <TierRibbon tier="DecisionSupport" />
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.15}>
              <h2 className="text-ink-900">{t("about.refusedTitle")}</h2>
              <ul className="mt-4 space-y-2">
                {refused.map((line) => (
                  <li key={line} className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-200/30 px-3 py-2 text-sm text-slate-600">
                    <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-pill border border-slate-400" />
                    <span className="line-through decoration-slate-400">{line}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.2} className="mt-12">
          <h2 className="text-ink-900">{t("about.evidenceTitle")}</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {EVIDENCE.map((e) => (
              <li key={e.id} className="surface-paper p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <a href={e.url} target="_blank" rel="noreferrer" className="font-medium text-ink-900 underline-offset-4 hover:underline">
                    {e.title}
                  </a>
                  <EvidenceChip strength={e.strength} />
                </div>
                <p className="mt-1 text-xs text-ink-400">
                  {e.organisation} · {e.year} · {t("strength.reviewed", { date: formatDate(e.reviewedAt, locale) })}
                </p>
                <p className="mt-1 text-ink-600">{e.summary}</p>
              </li>
            ))}
          </ul>
        </Reveal>
        <p className="mt-10 text-xs text-ink-400">{t("footer.disclaimer")}</p>
      </Page>
    </div>
  );
}
