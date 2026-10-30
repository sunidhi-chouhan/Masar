"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { LocaleSwitch } from "@/components/ui/locale-switch";
import { SimulatedBadge } from "@/components/ui/atoms";
import { LUX, Magnetic } from "@/components/journey/magnetic";
import { JourneyRolePicker } from "@/components/journey/journey-role-picker";
import { BioTimeline } from "@/components/landing/bio-timeline";

type RoleId = "female" | "male" | "clinician" | "admin";

const METRICS = [
  { key: "cycle" as const, tone: "shifting" as const },
  { key: "metabolic" as const, tone: "discuss" as const },
  { key: "unknown" as const, tone: "unknown" as const },
];

const TONE_CLASS = {
  shifting: "border-peach-300 bg-peach-200/50 text-peach-700",
  discuss: "border-amber-400/60 bg-amber-100 text-amber-700",
  unknown: "border-dashed border-slate-400 bg-slate-200/40 text-slate-600",
} as const;

/**
 * Marketing landing — full-bleed clinical hero, asymmetric sections,
 * Masar tokens only (ui-design-brain + creative-ui).
 */
export function BioLanding({
  locale,
  roles,
}: {
  locale: string;
  roles: { id: RoleId; title: string; body: string }[];
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion() === true;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-dawn-50 text-ink-900">
      <a
        href="#landing-main"
        className="absolute start-4 top-4 z-50 -translate-y-[220%] rounded-md bg-mist-700 px-3 py-2 text-sm font-medium text-white focus:translate-y-0"
      >
        {t("landing.bio.skipToContent")}
      </a>

      {/* Minimal sticky chrome — brand stays hero-level below */}
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 md:px-8">
          <nav className="ms-auto hidden items-center gap-1 md:flex" aria-label="Page">
            {(
              [
                ["#signals", "navSignals"],
                ["#timeline", "navTimeline"],
                ["#enter", "navEnter"],
              ] as const
            ).map(([href, key]) => (
              <a
                key={href}
                href={href}
                className="rounded-md px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                {t(`landing.bio.${key}`)}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 md:ms-2">
            <span className="hidden rounded-sm border border-dashed border-white/45 bg-white/10 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white/90 sm:inline">
              {t("common.simulated")}
            </span>
            <div className="rounded-pill bg-white/95 shadow-sm">
              <LocaleSwitch />
            </div>
          </div>
        </div>
      </header>

      <main id="landing-main" tabIndex={-1} className="outline-none">
        {/* HERO — full-bleed, brand + one headline + one sentence + CTAs */}
        <section className="relative min-h-[100dvh] overflow-hidden">
          <Image
            src="/landing/calm.jpg"
            alt={t("landing.bio.heroImageAlt")}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_40%]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_35%,rgba(29,87,81,0.45)_0%,transparent_52%),linear-gradient(105deg,rgba(31,28,25,0.78)_0%,rgba(31,28,25,0.55)_48%,rgba(31,28,25,0.35)_100%),linear-gradient(180deg,rgba(31,28,25,0.35)_0%,rgba(31,28,25,0.75)_100%)]"
          />

          <div className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-4 pb-16 pt-28 md:px-8 md:pb-20">
            <div className="mx-auto w-full max-w-6xl">
              <motion.div
                className="max-w-2xl"
                initial={false}
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: reduce ? 0 : 0.09 } },
                }}
              >
                <motion.p
                  className="font-display text-3xl tracking-tight text-white md:text-4xl"
                  variants={{
                    hidden: { opacity: 0, y: 14 },
                    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.55, ease: LUX } },
                  }}
                >
                  <span className="font-semibold">{t("common.appName")}</span>
                  <span className="text-white/45"> · </span>
                  <span className="text-mist-300">{t("common.appNameAr")}</span>
                </motion.p>

                <motion.h1
                  className="mt-5 font-display text-[clamp(2.15rem,5.5vw,3.75rem)] leading-[1.05] tracking-tight text-white"
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.6, ease: LUX } },
                  }}
                >
                  {t("landing.bio.heroTitle")}
                </motion.h1>

                <motion.p
                  className="mt-4 max-w-xl text-base leading-relaxed text-white/88 md:text-lg"
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5, ease: LUX } },
                  }}
                >
                  {t("landing.bio.heroBody")}
                </motion.p>

                <motion.div
                  className="mt-8 flex flex-wrap items-center gap-3"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.45, ease: LUX } },
                  }}
                >
                  <Magnetic>
                    <a
                      href="#enter"
                      className="inline-flex min-h-11 items-center justify-center rounded-md bg-mist-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-mist-300 hover:text-mist-700"
                    >
                      {t("landing.bio.ctaEnter")}
                    </a>
                  </Magnetic>
                  <a
                    href="#timeline"
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/35 bg-white/5 px-5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/15"
                  >
                    {t("landing.bio.ctaTimeline")}
                  </a>
                </motion.div>

                <motion.p
                  className="mt-8 max-w-md text-sm leading-snug text-white/70"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.2 } },
                  }}
                >
                  {t("landing.bio.privacyLine")}
                </motion.p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SIGNALS — asymmetric: copy + pillars + illustrative list (not equal card grid) */}
        <section id="signals" className="relative py-16 md:py-24" aria-labelledby="signals-heading">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--mist-100)_80%,transparent),transparent_50%)]"
          />
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 md:grid-cols-12 md:gap-10 md:px-8">
            <motion.div
              className="md:col-span-5 md:sticky md:top-24 md:self-start"
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: reduce ? 0 : 0.5, ease: LUX }}
            >
              <p className="label-caps text-mist-700">{t("landing.bio.signalsEyebrow")}</p>
              <h2 id="signals-heading" className="mt-2 font-display text-3xl tracking-tight text-ink-900 md:text-4xl">
                {t("landing.bio.signalsTitle")}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-ink-600">{t("landing.bio.signalsBody")}</p>

              <ul className="mt-8 space-y-5 border-s-2 border-mist-300 ps-4">
                {(["direction", "confidence", "consent"] as const).map((id) => (
                  <li key={id}>
                    <p className="font-display text-lg text-ink-900">{t(`landing.bio.pillars.${id}.title`)}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">{t(`landing.bio.pillars.${id}.body`)}</p>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="md:col-span-7"
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: reduce ? 0 : 0.55, ease: LUX }}
            >
              <div className="relative overflow-hidden rounded-lg">
                <div className="relative aspect-[5/3] md:aspect-[4/3]">
                  <Image
                    src="/landing/path.jpg"
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 55vw"
                    className="object-cover"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/25 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                      {t("landing.bio.readout.illustrative")}
                    </p>
                    <SimulatedBadge />
                  </div>
                  <ul className="mt-3 space-y-2">
                    {METRICS.map((m, i) => (
                      <motion.li
                        key={m.key}
                        className="flex flex-wrap items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-md"
                        initial={false}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.08 * i, ease: LUX }}
                      >
                        <span className="min-w-[7rem] text-sm font-medium text-white">
                          {t(`landing.bio.metrics.${m.key}.label`)}
                        </span>
                        <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${TONE_CLASS[m.tone]}`}>
                          {t(`landing.bio.metrics.${m.key}.direction`)}
                        </span>
                        <span className="basis-full text-xs leading-snug text-white/75 sm:basis-auto sm:ms-auto sm:max-w-[14rem] sm:text-end">
                          {t(`landing.bio.metrics.${m.key}.note`)}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[11px] text-white/55">
                    {t("landing.bio.evidence.disclaimer")} · {t("common.notDiagnosis")}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <BioTimeline />

        {/* ENTER */}
        <section id="enter" className="relative overflow-hidden border-t border-dawn-200 bg-dawn-100/60 py-16 md:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute -end-24 top-0 h-72 w-72 rounded-pill bg-[radial-gradient(circle,color-mix(in_srgb,var(--mist-300)_45%,transparent),transparent_70%)]"
          />
          <div className="relative mx-auto w-full max-w-6xl px-4 md:px-8">
            <motion.div
              className="max-w-2xl"
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: reduce ? 0 : 0.45, ease: LUX }}
            >
              <p className="label-caps text-mist-700">{t("landing.bio.enterEyebrow")}</p>
              <h2 className="mt-2 font-display text-3xl tracking-tight text-ink-900 md:text-4xl">
                {t("landing.bio.enterTitle")}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-ink-600">{t("landing.bio.enterBody")}</p>
            </motion.div>

            <div className="mt-10">
              <JourneyRolePicker locale={locale} roles={roles} tone="clinical" />
            </div>

            <p className="mt-10 max-w-lg text-sm text-ink-400">
              {t("journey.roles.seededHint")}{" "}
              <Link href={`/${locale}/login`} className="font-medium text-mist-700 underline-offset-4 hover:underline">
                {t("nav.login")}
              </Link>
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-dawn-200 bg-dawn-50 px-4 py-8 text-center md:px-8">
        <p className="mx-auto max-w-3xl text-xs leading-relaxed text-ink-400">{t("footer.disclaimer")}</p>
        <p className="mt-2 text-xs text-ink-400/80">{t("landing.bio.photoCredit")}</p>
      </footer>
    </div>
  );
}
