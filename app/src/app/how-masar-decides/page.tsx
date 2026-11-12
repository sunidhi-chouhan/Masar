import type { Metadata } from "next";
import Link from "next/link";
import { Timing } from "@/components/editorial";
import { Brand, Footer } from "@/components/ui";
import { MEASURE_BASIS, TRIGGER } from "@/lib/decides";
import { t, type Lang } from "@/lib/i18n";
import { OPTION_LABEL, RULES, type SignalCode } from "@/lib/signals";
import { MEASURES } from "@/lib/trajectory";
import { setLanguage } from "@/server/actions";
import { getLang } from "@/server/lang";

// The published rules, rendered from the same RULES and MEASURES the product
// runs on, so this page cannot drift from what Masar does. Public; no person's
// data appears here.

export const instant = false;
export const metadata: Metadata = { title: "How Masar decides · Masar" };

const ORDER: SignalCode[] = Object.keys(RULES) as SignalCode[];

function Rule({ code, lang }: { code: SignalCode; lang: Lang }) {
  const r = RULES[code];
  const tr = (s: string) => t(lang, s);
  return (
    <li className="py-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="display max-w-2xl text-[1.45rem] leading-snug text-ink">{tr(r.title)}</h3>
        <Timing urgency={r.urgency} lang={lang} />
      </div>
      <dl className="mt-4 grid gap-x-8 gap-y-3 text-[15px] leading-relaxed md:grid-cols-[11rem_1fr]">
        <dt className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-ink-3 md:pt-1">{tr("When Masar raises it")}</dt>
        <dd className="text-ink">{tr(TRIGGER[code])}</dd>
        <dt className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-ink-3 md:pt-1">{tr("Why it matters")}</dt>
        <dd className="text-ink-2">{tr(r.whyItMatters)}</dd>
        <dt className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-ink-3 md:pt-1">{tr("What it can't tell")}</dt>
        <dd className="text-ink-2">{tr(r.cannotTell)}</dd>
        <dt className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-ink-3 md:pt-1">{tr("Evidence")}</dt>
        <dd className="text-ink-2">
          <span lang="en" dir="ltr">
            {r.evidence.citation}
          </span>
          <span className="ms-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[12.5px] font-semibold text-ink-2">{tr(r.evidence.strength)}</span>
        </dd>
        <dt className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-ink-3 md:pt-1">{tr("Options a doctor may discuss")}</dt>
        <dd className="text-ink-2">{r.options.map((o) => tr(OPTION_LABEL[o].title)).join(" · ")}</dd>
      </dl>
    </li>
  );
}

export default async function HowMasarDecides() {
  const lang = await getLang();
  const tr = (s: string, vars?: Record<string, string | number>) => t(lang, s, vars);
  const never = [
    "A fertility score, ranking or any single number for your reproductive health.",
    "A chance of pregnancy, a prediction of when menopause will happen, or a fertility window.",
    "A diagnosis or a treatment decision. Those stay with a qualified doctor.",
    "A new number from the assistant. It can only repeat what is in your record.",
    "Any use by employers, insurers or marketing. Those purposes don't exist in Masar.",
  ];
  const tiers = [
    ["Education", "General information about reproductive health and tests. Masar can give this to anyone."],
    ["Decision support", "Your own record explained, and the options a doctor may discuss. Masar never picks one for you."],
    ["Clinical advice", "Interpreting results, testing and treatment. Only a qualified doctor gives this; Masar routes you to one."],
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-4 md:px-8">
        <Brand />
        <div className="ms-auto flex items-center gap-2">
          <form action={setLanguage.bind(null, lang === "ar" ? "en" : "ar")}>
            <button lang={lang === "ar" ? "en" : "ar"} className="min-h-[44px] rounded-full px-3 text-[14px] font-semibold text-accent hover:bg-accent-soft">
              {lang === "ar" ? "English" : "العربية"}
            </button>
          </form>
          <Link href="/" className="link text-[14px]">
            {tr("Back to Masar")}
          </Link>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-10 md:px-8">
        <p className="eyebrow">{tr("How Masar decides")}</p>
        <h1 className="display mt-3 max-w-3xl text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.06] text-ink">{tr("The rules, in the open.")}</h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-2">
          {tr(
            "Masar doesn't use a score or a model to decide what to raise. It uses the published rules below, the same ones the app runs. Each names its evidence, what it can't tell you and how soon it suggests talking. A doctor makes every clinical decision.",
          )}
        </p>

        <section aria-labelledby="never" className="mt-12 rounded-[22px] border border-rule bg-surface p-6 md:p-8">
          <h2 id="never" className="display text-[1.6rem] leading-tight text-ink">
            {tr("What Masar never gives you")}
          </h2>
          <ul className="mt-4 grid gap-3 text-[15px] leading-relaxed text-ink-2 md:grid-cols-2">
            {never.map((x) => (
              <li key={x} className="flex gap-3">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-urgent" />
                {tr(x)}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="rules" className="mt-16">
          <p className="eyebrow">{tr("{n} rules", { n: ORDER.length })}</p>
          <h2 id="rules" className="display mt-2 text-[clamp(1.7rem,3.2vw,2.3rem)] leading-[1.12] text-ink">
            {tr("When Masar suggests a conversation")}
          </h2>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-ink-2">
            {tr("A rule only uses what the person has chosen to share. If a source is switched off, the rule can't see it.")}
          </p>
          <ul className="mt-4 divide-y divide-rule border-y border-rule">
            {ORDER.map((code) => (
              <Rule key={code} code={code} lang={lang} />
            ))}
          </ul>
        </section>

        <section aria-labelledby="change" className="mt-16">
          <h2 id="change" className="display text-[clamp(1.7rem,3.2vw,2.3rem)] leading-[1.12] text-ink">
            {tr("When a change counts as real")}
          </h2>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-ink-2">
            {tr("One reading is never a trend. Two readings less than 30 days apart are too close to compare. Anything smaller than these thresholds is described as normal variation.")}
          </p>
          <div className="mt-6 overflow-x-auto rounded-[18px] border border-rule bg-surface">
            <table className="w-full min-w-[560px] text-start text-[14.5px]">
              <thead>
                <tr className="border-b border-rule text-start font-mono text-[11.5px] uppercase tracking-[0.08em] text-ink-3">
                  <th scope="col" className="px-4 py-3 text-start font-medium">{tr("Measure")}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{tr("Called a real change when")}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">{tr("Where the threshold comes from")}</th>
                </tr>
              </thead>
              <tbody>
                {MEASURES.map((m) => (
                  <tr key={m.code} className="border-b border-rule align-top last:border-0">
                    <th scope="row" className="px-4 py-3 text-start font-semibold text-ink">{tr(m.label)}</th>
                    <td className="px-4 py-3 text-ink-2">{tr(m.rule)}</td>
                    <td className="px-4 py-3 text-ink-2">{tr(MEASURE_BASIS[m.code])}</td>
                  </tr>
                ))}
                <tr className="align-top">
                  <th scope="row" className="px-4 py-3 text-start font-semibold text-ink">{tr("Thyroid hormone (TSH)")}</th>
                  <td className="px-4 py-3 text-ink-2">{tr("Never: Masar shows the value and does not interpret it.")}</td>
                  <td className="px-4 py-3 text-ink-2">{tr(MEASURE_BASIS.tsh)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="who-decides" className="mt-16">
          <h2 id="who-decides" className="display text-[clamp(1.7rem,3.2vw,2.3rem)] leading-[1.12] text-ink">
            {tr("Rules decide. The assistant explains. Doctors advise.")}
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {tiers.map(([title, body], i) => (
              <li key={title} className="rounded-[18px] border border-rule bg-surface p-5">
                <p className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-ink-3">0{i + 1}</p>
                <p className="mt-2 text-[16px] font-semibold text-ink">{tr(title)}</p>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{tr(body)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-2xl text-[14.5px] leading-relaxed text-ink-3">
            {tr("Masar's own thresholds are marked above and will be reviewed by clinicians before a pilot. Nothing on this page is medical advice.")}
          </p>
        </section>
      </main>
      <Footer lang={lang} />
    </div>
  );
}
