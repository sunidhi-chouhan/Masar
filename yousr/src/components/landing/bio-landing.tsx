"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { LocaleSwitch } from "@/components/ui/locale-switch";
import { LUX } from "@/components/journey/magnetic";
import { JourneyRolePicker } from "@/components/journey/journey-role-picker";
import { MasarMark } from "@/components/layout/sidebar-nav";

type RoleId = "female" | "male" | "clinician" | "admin";

/* ---------- small drawing helpers (illustrative synthetic data only) ---------- */

function sparkPath(values: number[], w: number, h: number, pad = 4) {
  const min = Math.min(...values);
  const span = Math.max(Math.max(...values) - min, 0.01);
  const pts = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (w - pad * 2),
    h - pad - ((v - min) / span) * (h - pad * 2),
  ]);
  return { d: pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" "), last: pts[pts.length - 1] };
}

function Spark({ values, color, className = "" }: { values: number[]; color: string; className?: string }) {
  const { d, last } = sparkPath(values, 120, 36);
  return (
    <svg viewBox="0 0 120 36" className={className} aria-hidden>
      <path d={`${d} L116 36 L4 36 Z`} fill={color} opacity="0.1" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill="#fff" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

function Tick({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden>
      <path d="m3.8 8.4 2.7 2.7 5.7-5.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const C = { pine: "var(--mist-500)", gold: "var(--amber-400)", clay: "var(--peach-500)" };

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion() === true;
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : delay, ease: LUX }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- hero product window ---------- */

function ProductWindow() {
  const { t } = useI18n();
  const tiles = [
    { k: "cycle", dir: "Discuss", color: C.gold, v: [29, 30, 28, 33, 36, 34, 38] },
    { k: "reserve", dir: "Shifting", color: C.clay, v: [2.4, 2.3, 2.1, 1.9, 1.6, 1.4] },
    { k: "metabolic", dir: "Stable", color: C.pine, v: [24.1, 23.9, 24.2, 24, 23.8, 23.9] },
    { k: "lifestyle", dir: "Improving", color: C.pine, v: [3, 4, 4, 5, 6, 7] },
  ] as const;
  return (
    <div className="overflow-hidden rounded-[20px] bg-white text-start shadow-[0_40px_120px_-30px_rgba(3,25,23,0.65),0_0_0_1px_rgba(255,255,255,0.08)]">
      <div className="flex items-center gap-2 border-b border-dawn-200/70 bg-dawn-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-dawn-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-dawn-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-dawn-300" />
        <span className="mx-auto rounded-md bg-white px-10 py-0.5 text-[11px] text-ink-400 ring-1 ring-dawn-200">masar.health</span>
      </div>
      <div className="grid grid-cols-[3.25rem_1fr] md:grid-cols-[11rem_1fr]">
        <div className="border-e border-dawn-200/70 p-3">
          <MasarMark className="h-7 w-7" />
          <div className="mt-5 space-y-1.5">
            {["trajectory", "livingWell", "actions", "privacy"].map((k, i) => (
              <div key={k} className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${i === 0 ? "bg-mist-100/80" : ""}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-mist-700" : "bg-dawn-300"}`} />
                <span className={`hidden text-[11.5px] md:block ${i === 0 ? "font-semibold text-mist-700" : "text-ink-500"}`}>{t(`nav.${k}`)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0 p-4 md:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">{t("dashboard.summary.eyebrow")}</p>
          <p className="mt-1 font-display text-2xl text-ink-900 md:text-[1.75rem]">{t("dashboard.summary.greeting", { name: "Sara" })}</p>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <div className="surface-pine p-4 !rounded-2xl">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/55">{t("dashboard.summary.read")}</p>
              <p className="mt-1.5 text-[15px] font-semibold leading-snug text-white">{t("dashboard.summary.readWatch", { n: 3 })}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(["cycle", "conditions", "reserve"] as const).map((d, i) => (
                  <span key={d} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] text-white ring-1 ring-inset ring-white/15">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: i === 2 ? C.clay : C.gold }} />
                    {t(`domains.short.${d}`)}
                  </span>
                ))}
              </div>
              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/55">{t("dashboard.summary.nextStep")}</p>
                <p className="mt-1 text-[12.5px] font-semibold text-white">{t("actions.titles.counsel_preconception")}</p>
                <div className="mt-2 flex gap-1">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <span key={s} className={`h-1 flex-1 rounded-full ${s < 3 ? "bg-amber-400" : "bg-white/15"}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden rounded-2xl border border-dawn-200 p-4 lg:block">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink-400">{t("dashboard.summary.completeness")}</p>
              <p className="mt-1.5 font-display text-3xl text-ink-900">26</p>
              <div className="mt-2 flex gap-1">
                {[1, 1, 1, 1, 0].map((on, i) => (
                  <span key={i} className={`h-1 flex-1 rounded-full ${on ? "bg-mist-500" : "bg-dawn-200"}`} />
                ))}
              </div>
              <p className="mt-3 rounded-lg border border-dashed border-dawn-300 px-2.5 py-2 text-[11px] text-ink-600">{t("missing.afc")}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {tiles.map((tile) => (
              <div key={tile.k} className="rounded-xl border border-dawn-200 p-3">
                <p className="text-[11.5px] font-semibold text-ink-900">{t(`domains.short.${tile.k}`)}</p>
                <Spark values={[...tile.v]} color={tile.color} className="mt-2 h-8 w-full" />
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-dawn-100 px-1.5 py-0.5 text-[10px] text-ink-700">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: tile.color }} />
                  {t(`directions.${tile.dir}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- bento tiles ---------- */

function BentoCard({ title, body, children, className = "", dark = false }: { title: string; body: string; children: ReactNode; className?: string; dark?: boolean }) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-[24px] p-6 transition-shadow duration-300 md:p-7 ${
        dark ? "surface-pine !rounded-[24px]" : "border border-dawn-200/80 bg-white shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)]"
      } ${className}`}
    >
      <div className="relative flex-1">{children}</div>
      <div className="relative mt-6">
        <h3 className={`text-[17px] font-semibold tracking-[-0.01em] ${dark ? "text-white" : "text-ink-900"}`}>{title}</h3>
        <p className={`mt-1.5 max-w-md text-[14px] leading-relaxed ${dark ? "text-white/65" : "text-ink-600"}`}>{body}</p>
      </div>
    </div>
  );
}

function TrajectoryArt() {
  // Cycle lengths across a year with the "normal variation" band shaded.
  const vals = [28, 29, 28, 30, 29, 28, 31, 33, 35, 34, 37, 38];
  const W = 560;
  const H = 170;
  const y = (v: number) => H - 12 - ((v - 22) / (42 - 22)) * (H - 24);
  const x = (i: number) => 16 + (i / (vals.length - 1)) * (W - 32);
  const d = vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden>
      <rect x="0" y={y(35)} width={W} height={y(21) - y(35)} fill="var(--mist-100)" rx="10" />
      <text x="14" y={y(35) + 16} fontSize="11" fill="var(--mist-700)" fontWeight="600">
        21–35 days
      </text>
      {[0, 1, 2, 3].map((g) => (
        <line key={g} x1="0" x2={W} y1={20 + g * 42} y2={20 + g * 42} stroke="var(--dawn-200)" strokeDasharray="3 5" />
      ))}
      <path d={d} fill="none" stroke="var(--ink-700)" strokeWidth="2" strokeLinejoin="round" />
      {vals.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i > 7 ? 4.5 : 3.5} fill={v > 35 ? "var(--amber-400)" : "#fff"} stroke={v > 35 ? "var(--amber-700)" : "var(--ink-700)"} strokeWidth="1.6" />
      ))}
    </svg>
  );
}

/* ---------- page ---------- */

export function BioLanding({
  locale,
  roles,
}: {
  locale: string;
  roles: { id: RoleId; title: string; body: string }[];
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion() === true;
  const tl = (k: string, v?: Record<string, string | number>) => t(`landing.v2.${k}`, v);

  return (
    <div className="landing-sans relative min-h-dvh overflow-x-hidden bg-dawn-50 text-ink-900">
      <a
        href="#landing-main"
        className="absolute start-4 top-4 z-50 -translate-y-[220%] rounded-md bg-white px-3 py-2 text-sm font-medium text-ink-900 focus:translate-y-0"
      >
        {t("landing.bio.skipToContent")}
      </a>

      {/* ================= HERO ================= */}
      <section className="relative isolate z-10 bg-mist-900 pb-0 text-white">
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(23,117,107,0.55),transparent_70%),radial-gradient(35%_35%_at_85%_25%,rgba(200,151,58,0.22),transparent_70%),radial-gradient(40%_40%_at_10%_40%,rgba(166,207,198,0.16),transparent_70%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(70%_60%_at_50%_20%,#000,transparent)]"
        />
        </div>

        <header className="relative z-10">
          <div className="mx-auto flex max-w-[84rem] items-center gap-6 px-4 py-5 md:px-8">
            <Link href={`/${locale}`} className="flex items-center gap-2.5">
              <MasarMark className="h-8 w-8" inverted />
              <span className="text-[1.15rem] font-semibold tracking-[-0.02em]">{t("common.appName")}</span>
              <span className="text-sm text-white/45">{t("common.appNameAr")}</span>
            </Link>
            <nav className="ms-6 hidden items-center gap-1 lg:flex" aria-label="Page">
              {(
                [
                  ["#product", "product"],
                  ["#journey", "journey"],
                  ["#privacy", "privacy"],
                  ["#enter", "clinicians"],
                ] as const
              ).map(([href, k]) => (
                <a key={href} href={href} className="rounded-full px-3.5 py-2 text-[14px] text-white/70 transition-colors hover:text-white">
                  {tl(`nav.${k}`)}
                </a>
              ))}
            </nav>
            <div className="ms-auto flex items-center gap-2.5">
              <div className="rounded-full bg-white/95">
                <LocaleSwitch />
              </div>
              <Link
                href={`/${locale}/login`}
                className="hidden min-h-9 items-center rounded-full px-4 text-[14px] font-medium text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/10 sm:inline-flex"
              >
                {t("nav.login")}
              </Link>
            </div>
          </div>
        </header>

        <main id="landing-main" tabIndex={-1} className="outline-none">
          <div className="relative mx-auto max-w-[84rem] px-4 pt-14 text-center md:px-8 md:pt-20">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.7, ease: LUX }}
            >
              <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-3.5 py-1.5 text-[12.5px] text-white/80 ring-1 ring-inset ring-white/15 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {tl("pill")}
              </p>
              <h1 className="mx-auto mt-7 max-w-5xl text-[clamp(2.6rem,6.4vw,5.6rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-white">
                {tl("h1a")}{" "}
                <span className="bg-gradient-to-r from-amber-400 via-[#e7c98a] to-mist-300 bg-clip-text text-transparent">{tl("h1b")}</span>
              </h1>
              <p className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-white/70 md:text-lg">{tl("lede")}</p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#enter"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-mist-900 shadow-[0_10px_30px_-10px_rgba(255,255,255,0.45)] transition-colors hover:bg-amber-100"
                >
                  {tl("ctaPrimary")}
                  <span aria-hidden className="rtl:-scale-x-100">→</span>
                </a>
                <Link
                  href={`/${locale}/login`}
                  className="inline-flex min-h-12 items-center rounded-full px-6 text-[15px] font-medium text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/10"
                >
                  {tl("ctaSecondary")}
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[13.5px] text-white/65">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="inline-flex items-center gap-2">
                    <Tick className="h-4 w-4 text-amber-400" />
                    {tl(`trust.${i}`)}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="relative mx-auto mt-16 max-w-6xl"
              initial={reduce ? false : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 1, delay: reduce ? 0 : 0.25, ease: LUX }}
            >
              <div aria-hidden className="absolute -inset-x-10 -top-10 bottom-1/3 -z-10 rounded-[40px] bg-mist-500/20 blur-3xl" />
              <div className="translate-y-24 md:translate-y-28">
                <ProductWindow />
              </div>
            </motion.div>
          </div>
        </main>
      </section>

      {/* ================= FACTS ================= */}
      <section className="relative bg-dawn-50 pt-36 md:pt-44">
        <div className="mx-auto max-w-[84rem] px-4 md:px-8">
          <dl className="grid grid-cols-2 gap-y-8 border-y border-dawn-200 py-10 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="px-4 lg:border-s lg:border-dawn-200 lg:first:border-s-0">
                <dt className="sr-only">{tl(`facts.${i}.l`)}</dt>
                <dd className="text-[clamp(2.2rem,4vw,3.2rem)] font-semibold leading-none tracking-[-0.04em] text-ink-900">{tl(`facts.${i}.v`)}</dd>
                <p className="mt-2 max-w-[14rem] text-[14px] leading-snug text-ink-500">{tl(`facts.${i}.l`)}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ================= BENTO ================= */}
      <section id="product" className="scroll-mt-10 bg-dawn-50 py-24 md:py-32">
        <div className="mx-auto max-w-[84rem] px-4 md:px-8">
          <Reveal className="max-w-3xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-mist-600">{tl("bentoEyebrow")}</p>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-ink-900">{tl("bentoTitle")}</h2>
          </Reveal>

          <div className="mt-14 grid gap-4 md:grid-cols-6">
            <Reveal className="md:col-span-4">
              <BentoCard className="h-full" title={tl("bento.trajectory.t")} body={tl("bento.trajectory.b")}>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-ink-900">{t("domains.cycle")}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[12px] font-medium text-amber-700 ring-1 ring-inset ring-amber-400/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {t("directions.Discuss")}
                  </span>
                </div>
                <div className="mt-4">
                  <TrajectoryArt />
                </div>
              </BentoCard>
            </Reveal>

            <Reveal className="md:col-span-2" delay={0.06}>
              <BentoCard className="h-full" title={tl("bento.evidence.t")} body={tl("bento.evidence.b")}>
                <dl className="space-y-2.5 text-[12.5px]">
                  {(["observed", "matters", "evidence", "cannot"] as const).map((k, i) => (
                    <div key={k} className={`rounded-xl px-3 py-2.5 ${i === 3 ? "border border-dashed border-dawn-300" : "bg-dawn-100/70"}`}>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">{tl(`mock.${k}`)}</dt>
                      <dd className="mt-0.5 text-ink-900">{tl(`mock.${k}V`)}</dd>
                    </div>
                  ))}
                </dl>
              </BentoCard>
            </Reveal>

            <Reveal className="md:col-span-2" delay={0.04}>
              <BentoCard dark className="h-full" title={tl("bento.action.t")} body={tl("bento.action.b")}>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/55">{t("dashboard.summary.nextStep")}</p>
                <p className="mt-1 text-[16px] font-semibold text-white">{t("actions.titles.counsel_preconception")}</p>
                <ol className="mt-5 space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <li key={i} className="flex items-center gap-3 text-[13px]">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${
                          i < 2 ? "bg-amber-400 text-mist-900" : i === 2 ? "bg-white text-mist-900" : "text-white/40 ring-1 ring-inset ring-white/25"
                        }`}
                      >
                        {i < 2 ? <Tick className="h-3.5 w-3.5" /> : <span className="text-[11px] font-semibold">{i + 1}</span>}
                      </span>
                      <span className={i <= 2 ? "text-white" : "text-white/45"}>{tl(`mock.steps.${i}`)}</span>
                    </li>
                  ))}
                </ol>
              </BentoCard>
            </Reveal>

            <Reveal className="md:col-span-2" delay={0.08}>
              <BentoCard className="h-full" title={tl("bento.consent.t")} body={tl("bento.consent.b")}>
                <ul className="space-y-2">
                  {(["SelfReport", "LabMock", "DeviceMock"] as const).map((s, i) => (
                    <li key={s} className="flex items-center justify-between gap-3 rounded-xl border border-dawn-200 px-3 py-2.5">
                      <span className="truncate text-[13px] font-medium text-ink-900">{t(`privacy.sources.${s}`)}</span>
                      <span className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 ${i === 2 ? "bg-dawn-300" : "justify-end bg-mist-700"}`}>
                        <span className="h-4 w-4 rounded-full bg-white shadow" />
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-2">
                  {(["employer", "insurer"] as const).map((k) => (
                    <span key={k} className="inline-flex items-center gap-1.5 rounded-full bg-peach-200/70 px-2.5 py-1 text-[11.5px] font-medium text-peach-700">
                      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden>
                        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M4.2 11.8 11.8 4.2" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                      {tl(`mock.${k}`)}
                    </span>
                  ))}
                </div>
              </BentoCard>
            </Reveal>

            <Reveal className="md:col-span-2" delay={0.12}>
              <BentoCard className="h-full" title={tl("bento.clinician.t")} body={tl("bento.clinician.b")}>
                <ul className="divide-y divide-dawn-200 rounded-xl border border-dawn-200">
                  {(["queueA", "queueB"] as const).map((k, i) => (
                    <li key={k} className="relative flex items-center gap-3 px-3 py-2.5">
                      <span className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-amber-400" />
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mist-100 text-[11px] font-semibold text-mist-700">{i ? "O" : "M"}</span>
                      <span className="text-[13px] font-medium text-ink-900">{tl(`mock.${k}`)}</span>
                      <span className="ms-auto rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">{tl("mock.queueSig")}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-dawn-100 p-1 text-center text-[12px]">
                  {(["accept", "modify", "override"] as const).map((k, i) => (
                    <span key={k} className={`rounded-full py-1 ${i === 0 ? "bg-white font-medium text-mist-700 shadow-sm" : "text-ink-500"}`}>
                      {tl(`mock.${k}`)}
                    </span>
                  ))}
                </div>
              </BentoCard>
            </Reveal>

            <Reveal className="md:col-span-6" delay={0.06}>
              <div className="grid items-center gap-8 overflow-hidden rounded-[24px] border border-dawn-200/80 bg-white p-6 shadow-[var(--shadow-soft)] md:grid-cols-[1fr_1.3fr] md:p-10">
                <div>
                  <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-ink-900">{tl("bento.population.t")}</h3>
                  <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-ink-600">{tl("bento.population.b")}</p>
                </div>
                <div className="space-y-3">
                  {[
                    { l: t("population.kpis.uptake"), v: 64 },
                    { l: t("population.kpis.referral"), v: 48 },
                    { l: t("population.medianRequest"), v: 31 },
                  ].map((row, i) => (
                    <div key={row.l}>
                      <div className="flex justify-between text-[12.5px]">
                        <span className="text-ink-600">{row.l}</span>
                        <span className="font-semibold tabular-nums text-ink-900">{i === 2 ? `${row.v}d` : `${row.v}%`}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-dawn-100">
                        <motion.div
                          className={`h-full rounded-full ${i === 2 ? "bg-amber-400" : "bg-mist-500"}`}
                          initial={reduce ? false : { width: 0 }}
                          whileInView={{ width: `${row.v}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : 0.15 * i, ease: LUX }}
                          style={reduce ? { width: `${row.v}%` } : undefined}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="pt-1 text-[11.5px] text-ink-400">{t("landing.bio.evidence.disclaimer")}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= JOURNEY ================= */}
      <section id="journey" className="scroll-mt-10 border-y border-dawn-200 bg-white py-24 md:py-32">
        <div className="mx-auto max-w-[84rem] px-4 md:px-8">
          <Reveal className="max-w-3xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-mist-600">{tl("journeyEyebrow")}</p>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-ink-900">{tl("journeyTitle")}</h2>
          </Reveal>
          <ol className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-6 lg:gap-6">
            <span aria-hidden className="absolute inset-x-0 top-5 hidden h-px bg-gradient-to-r from-mist-500 via-amber-400 to-dawn-200 lg:block rtl:bg-gradient-to-l" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Reveal key={i} delay={i * 0.06}>
                <li className="relative list-none">
                  <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-mist-900 text-[14px] font-semibold text-white ring-[6px] ring-white">
                    {i + 1}
                  </span>
                  <p className="mt-5 text-[16px] font-semibold tracking-[-0.01em] text-ink-900">{tl(`journey.${i}.t`)}</p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-600">{tl(`journey.${i}.b`)}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= PRIVACY ================= */}
      <section id="privacy" className="scroll-mt-10 bg-dawn-50 py-20 md:py-28">
        <div className="mx-auto max-w-[84rem] px-4 md:px-8">
          <Reveal>
            <div className="surface-pine grid gap-10 !rounded-[32px] p-8 md:grid-cols-[1.2fr_1fr] md:p-14">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-amber-400">{tl("privacyEyebrow")}</p>
                <h2 className="mt-3 text-[clamp(1.9rem,3.6vw,3rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-white">{tl("privacyTitle")}</h2>
                <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/70">{tl("privacyBody")}</p>
              </div>
              <ul className="space-y-3 self-center">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-3 rounded-2xl bg-white/[0.06] px-4 py-3.5 text-[14.5px] text-white ring-1 ring-inset ring-white/10">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-mist-900">
                      <Tick className="h-3 w-3" />
                    </span>
                    {tl(`privacyItems.${i}`)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= ENTER ================= */}
      <section id="enter" className="scroll-mt-10 bg-dawn-50 pb-24 md:pb-32">
        <div className="mx-auto max-w-[84rem] px-4 md:px-8">
          <Reveal className="max-w-3xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-mist-600">{tl("enterEyebrow")}</p>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-ink-900">{tl("enterTitle")}</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-600">{tl("enterBody")}</p>
          </Reveal>
          <div className="mt-6">
            <JourneyRolePicker locale={locale} roles={roles} tone="clinical" />
          </div>
          <p className="mt-10 text-sm text-ink-500">
            {t("journey.roles.seededHint")}{" "}
            <Link href={`/${locale}/login`} className="font-medium text-mist-700 underline-offset-4 hover:underline">
              {t("nav.login")}
            </Link>
          </p>
        </div>
      </section>

      <footer className="border-t border-dawn-200 bg-white">
        <div className="mx-auto flex max-w-[84rem] flex-wrap items-center gap-4 px-4 py-8 md:px-8">
          <span className="flex items-center gap-2">
            <MasarMark className="h-7 w-7" />
            <span className="font-semibold tracking-[-0.02em]">{t("common.appName")}</span>
          </span>
          <p className="text-[13px] text-ink-500">{tl("footerNote")}</p>
          <p className="ms-auto max-w-xl text-[12px] leading-relaxed text-ink-400">{t("footer.disclaimer")}</p>
        </div>
      </footer>
    </div>
  );
}
