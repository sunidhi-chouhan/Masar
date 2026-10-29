"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { LocaleSwitch } from "@/components/ui/locale-switch";
import { LUX } from "@/components/journey/magnetic";
import { JourneyRolePicker } from "@/components/journey/journey-role-picker";
import { BioTimeline } from "@/components/landing/bio-timeline";

type RoleId = "female" | "male" | "clinician" | "admin";

const METRICS = [
  { key: "cycle" as const, tone: "shifting" as const },
  { key: "metabolic" as const, tone: "discuss" as const },
  { key: "unknown" as const, tone: "unknown" as const },
];

function splitDirection(raw: string): { direction: string; detail?: string } {
  const parts = raw.split(" · ").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return { direction: parts[0]!, detail: parts.slice(1).join(" · ") };
  return { direction: raw };
}

/** Shared horizontal lane for landing sections. */
const LANE = "mx-auto w-full max-w-6xl px-4 md:px-8";

/**
 * Landing — readable contained hero, compact readout, animated journey.
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

  const rotateWords = [
    t("landing.bio.rotate.earlier"),
    t("landing.bio.rotate.clearer"),
    t("landing.bio.rotate.calmer"),
    t("landing.bio.rotate.shared"),
  ];

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-base-100 text-base-content">
      <a href="#landing-main" className="btn btn-sm absolute start-4 top-4 z-50 -translate-y-[200%] focus:translate-y-0">
        {t("journey.skipToContent")}
      </a>

      <div className="navbar sticky top-0 z-40 h-14 min-h-14 border-b border-base-300/70 bg-base-100/95 px-4 backdrop-blur-xl md:px-8">
        <div className="navbar-start">
          <Link href={`/${locale}/journey`} className="font-display text-lg tracking-tight">
            <span className="font-semibold">{t("common.appName")}</span>
            <span className="text-base-content/40"> · </span>
            <span className="text-primary">{t("common.appNameAr")}</span>
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal gap-1 px-1 text-sm">
            <li>
              <a href="#signals">{t("landing.bio.navSignals")}</a>
            </li>
            <li>
              <a href="#timeline">{t("landing.bio.navTimeline")}</a>
            </li>
            <li>
              <a href="#enter">{t("landing.bio.navEnter")}</a>
            </li>
          </ul>
        </div>
        <div className="navbar-end gap-2">
          <span className="badge badge-ghost badge-sm badge-dash">{t("common.simulated")}</span>
          <LocaleSwitch />
        </div>
      </div>

      <main id="landing-main" tabIndex={-1} className="outline-none">
        {/* HERO — readable scrim, clear hierarchy, accessible privacy line */}
        <section className="pt-4 pb-2 md:pt-5 md:pb-3">
          <div className={LANE}>
            <div className="hero relative overflow-hidden rounded-box border border-base-300 shadow-md">
              <Image
                src="/landing/hero.jpg"
                alt={t("landing.bio.heroImageAlt")}
                fill
                priority
                sizes="(max-width: 1152px) 100vw, 1152px"
                className="object-cover object-[center_30%]"
              />
              {/* Layered scrim: solid left for type, softer right for photo */}
              <div
                className="absolute inset-0 bg-neutral/75!"
                style={{
                  backgroundImage:
                    "linear-gradient(105deg, color-mix(in srgb, var(--color-neutral) 88%, transparent) 0%, color-mix(in srgb, var(--color-neutral) 72%, transparent) 42%, color-mix(in srgb, var(--color-neutral) 40%, transparent) 100%)",
                }}
                aria-hidden
              />

              <div className="hero-content relative z-10 w-full max-w-none items-stretch justify-start px-5 py-7 text-start text-primary-content sm:px-7 md:px-9 md:py-8">
                <motion.div
                  className="w-full max-w-xl"
                  initial={false}
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: reduce ? 0 : 0.07 } },
                  }}
                >
                  <motion.p
                    className="badge badge-soft badge-primary mb-3"
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.35, ease: LUX } },
                    }}
                  >
                    {t("landing.bio.heroEyebrow")}
                  </motion.p>

                  <motion.h1
                    className="font-display text-[clamp(1.75rem,4.2vw,2.85rem)] leading-[1.12] tracking-tight text-primary-content drop-shadow-sm"
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5, ease: LUX } },
                    }}
                  >
                    {t("landing.bio.heroTitleBefore")}{" "}
                    <span className="text-rotate inline-block align-bottom text-secondary duration-9000">
                      <span>
                        {rotateWords.map((w) => (
                          <span key={w} className="text-secondary">
                            {w}
                          </span>
                        ))}
                      </span>
                    </span>
                  </motion.h1>

                  <motion.p
                    className="mt-3 max-w-lg text-sm leading-relaxed text-primary-content/95 md:text-base"
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: LUX } },
                    }}
                  >
                    {t("landing.bio.heroBody")}
                  </motion.p>

                  <motion.div
                    className="mt-5 flex flex-wrap items-center gap-3"
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: LUX } },
                    }}
                  >
                    <a href="#enter" className="btn btn-primary">
                      {t("landing.bio.ctaEnter")}
                    </a>
                    <a
                      href="#timeline"
                      className="btn border-primary-content/40 bg-primary-content/10 text-primary-content hover:bg-primary-content/20"
                    >
                      {t("landing.bio.ctaTimeline")}
                    </a>
                  </motion.div>

                  {/* Privacy — readable, not a faint corner whisper */}
                  <motion.p
                    className="mt-5 max-w-lg rounded-field border border-primary-content/25 bg-neutral/40 px-3 py-2.5 text-sm leading-snug text-primary-content/95 backdrop-blur-sm"
                    variants={{
                      hidden: { opacity: 0, y: 6 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: LUX } },
                    }}
                  >
                    {t("landing.bio.pillars.consent")}
                  </motion.p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* WHAT YOU WILL SEE */}
        <section
          id="signals"
          className="border-y border-base-300 bg-base-200 py-9 md:py-11"
          aria-labelledby="signals-heading"
        >
          <div className={LANE}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <motion.div
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: reduce ? 0 : 0.45, ease: LUX }}
                className="max-w-2xl"
              >
                <p className="label-caps text-primary">{t("landing.bio.signalsEyebrow")}</p>
                <h2 id="signals-heading" className="mt-1 font-display text-2xl tracking-tight md:text-3xl">
                  {t("landing.bio.signalsTitle")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-base-content/70 md:text-[0.95rem]">
                  {t("landing.bio.signalsBody")}
                </p>
              </motion.div>
              <span className="badge badge-soft badge-primary badge-sm shrink-0">
                {t("common.simulated")}
              </span>
            </div>

            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  { title: "colArea", body: "legendArea" },
                  { title: "colDirection", body: "legendDirection" },
                  { title: "colConfidence", body: "legendConfidence" },
                  { title: "colUnknown", body: "legendUnknown" },
                ] as const
              ).map((item, i) => (
                <motion.li
                  key={item.title}
                  className="rounded-box border border-base-300 bg-base-100 px-3.5 py-3"
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : i * 0.05, ease: LUX }}
                >
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                    {t(`landing.bio.readout.${item.title}`)}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-base-content/70">
                    {t(`landing.bio.readout.${item.body}`)}
                  </p>
                </motion.li>
              ))}
            </ul>

            <motion.div
              className="mt-6 overflow-hidden rounded-box border border-base-300 bg-base-100"
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: reduce ? 0 : 0.45, ease: LUX }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-300 bg-base-200/70 px-4 py-2.5">
                <p className="text-sm font-medium text-base-content/80">
                  {t("landing.bio.readout.illustrative")}
                </p>
                <span className="badge badge-ghost badge-sm badge-dash">{t("common.simulated")}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-base-content/50">
                      <th>{t("landing.bio.readout.colArea")}</th>
                      <th>{t("landing.bio.readout.colDirection")}</th>
                      <th className="hidden sm:table-cell">{t("landing.bio.readout.colConfidence")}</th>
                      <th>{t("landing.bio.readout.colUnknown")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {METRICS.map((m) => {
                      const raw = t(`landing.bio.metrics.${m.key}.direction`);
                      const { direction, detail } = splitDirection(raw);
                      const isUnknown = m.tone === "unknown";
                      return (
                        <tr key={m.key}>
                          <td className="font-medium whitespace-nowrap">
                            {t(`landing.bio.metrics.${m.key}.label`)}
                          </td>
                          <td>
                            <span
                              className={`badge badge-sm ${
                                isUnknown
                                  ? "badge-ghost"
                                  : m.tone === "discuss"
                                    ? "badge-warning badge-soft"
                                    : "badge-secondary badge-soft"
                              }`}
                            >
                              {direction}
                            </span>
                          </td>
                          <td className="hidden text-sm text-base-content/70 sm:table-cell">
                            {isUnknown ? (
                              <span className="italic text-base-content/45">—</span>
                            ) : (
                              (detail ?? "—")
                            )}
                          </td>
                          <td className="max-w-[16rem] text-sm text-base-content/65">
                            {t(`landing.bio.metrics.${m.key}.note`)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-base-300 px-4 py-2.5 text-xs leading-relaxed text-base-content/55">
                {t("landing.bio.evidence.disclaimer")} · {t("common.notDiagnosis")}
              </p>
            </motion.div>
          </div>
        </section>

        <BioTimeline />

        <section id="enter" className="bg-base-100 py-10 md:py-12">
          <div className={LANE}>
            <motion.div
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: reduce ? 0 : 0.45, ease: LUX }}
              className="max-w-2xl"
            >
              <p className="label-caps text-primary">{t("landing.bio.enterEyebrow")}</p>
              <h2 className="mt-1 font-display text-2xl tracking-tight md:text-3xl">
                {t("landing.bio.enterTitle")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-base-content/70 md:text-[0.95rem]">
                {t("landing.bio.enterBody")}
              </p>
            </motion.div>
            <motion.div
              className="mt-7"
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: reduce ? 0 : 0.5, ease: LUX }}
            >
              <JourneyRolePicker locale={locale} roles={roles} tone="clinical" />
            </motion.div>
            <p className="mt-8 max-w-lg text-sm text-base-content/50">
              {t("journey.roles.seededHint")}{" "}
              <Link href={`/${locale}/login`} className="link link-primary">
                {t("nav.login")}
              </Link>
            </p>
          </div>
        </section>
      </main>

      <footer className="footer footer-center border-t border-base-300 bg-base-200 p-5 text-base-content">
        <aside>
          <p className="max-w-3xl text-xs leading-relaxed opacity-70">{t("footer.disclaimer")}</p>
          <p className="text-xs opacity-50">{t("landing.bio.photoCredit")}</p>
        </aside>
      </footer>
    </div>
  );
}
