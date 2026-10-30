"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { pickJourneyRole } from "@/server/actions/journey";
import {
  JourneyButtonLoader,
  useDelayedFlag,
  useJourneyMotion,
} from "@/components/journey/journey-loaders";
import { JourneyPathMotif } from "@/components/journey/journey-path-motif";

type RoleId = "female" | "male" | "clinician" | "admin";

const LUX = [0.16, 1, 0.3, 1] as const;

function RoleGlyph({ id }: { id: RoleId }) {
  if (id === "female" || id === "male") {
    return (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M6.5 19.5c1.2-3.2 3.1-4.75 5.5-4.75s4.3 1.55 5.5 4.75"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (id === "clinician") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M9 4.5h6v2.25a3 3 0 0 1-3 3h0a3 3 0 0 1-3-3V4.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M12 9.75V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="17.25" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4.5 18.5V9.5L12 5l7.5 4.5v9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9.5 18.5v-5h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function JourneyRolePicker({
  locale,
  roles,
  tone: _tone = "default",
}: {
  locale: string;
  roles: { id: RoleId; title: string; body: string; tag?: string }[];
  tone?: "default" | "clinical";
}) {
  void _tone;
  const { t } = useI18n();
  const { animate, live, dur } = useJourneyMotion();
  const [pending, start] = useTransition();
  const [picked, setPicked] = useState<RoleId | null>(null);
  const [hover, setHover] = useState<RoleId | null>(null);
  const showLoader = useDelayedFlag(pending);

  const people = roles.filter((r) => r.id === "female" || r.id === "male");
  const workspaces = roles.filter((r) => r.id === "clinician" || r.id === "admin");

  const submit = (id: RoleId) => {
    setPicked(id);
    start(() => {
      void pickJourneyRole(locale, id);
    });
  };

  return (
    <div className="mt-10 space-y-12">
      <div>
        <motion.p
          className="label-caps mb-4"
          initial={{ opacity: 0 }}
          animate={live ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: dur(0.35), delay: animate ? 0.05 : 0 }}
        >
          {t("journey.roles.personalPaths")}
        </motion.p>

        <motion.ul
          className="grid gap-4 sm:grid-cols-2 sm:gap-5"
          initial="hidden"
          animate={live ? "show" : "hidden"}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: animate ? 0.1 : 0 } },
          }}
        >
          {people.map((r) => {
            const busy = showLoader && picked === r.id;
            const active = hover === r.id || picked === r.id;
            const wash =
              r.id === "female"
                ? "from-mist-100/90 via-white to-dawn-50"
                : "from-dawn-100/95 via-white to-peach-200/25";
            const motif = r.id === "female" ? "mist" : "dawn";

            return (
              <motion.li
                key={r.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: dur(0.45), ease: LUX },
                  },
                }}
              >
                <form action={() => submit(r.id)} className="h-full">
                  <motion.button
                    type="submit"
                    disabled={pending}
                    onHoverStart={() => setHover(r.id)}
                    onHoverEnd={() => setHover(null)}
                    whileHover={animate && !pending ? { y: -4 } : undefined}
                    whileTap={animate && !pending ? { scale: 0.985 } : undefined}
                    className={`group relative flex h-full min-h-[13.5rem] w-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br ${wash} p-5 text-start shadow-[var(--shadow-soft)] outline-none transition-[box-shadow] duration-300 hover:shadow-[var(--shadow-lift)] focus-visible:ring-2 focus-visible:ring-mist-500 disabled:opacity-70 sm:p-6`}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -end-8 -top-10 h-36 w-36 rounded-pill bg-[radial-gradient(circle,color-mix(in_srgb,var(--mist-300)_40%,transparent),transparent_70%)] opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                    />
                    <span className="relative flex items-center justify-between gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-mist-700 shadow-[var(--shadow-soft)]">
                        <RoleGlyph id={r.id} />
                      </span>
                      <span className="rounded-pill bg-white/70 px-2.5 py-1 text-[11px] font-medium tracking-wide text-mist-700">
                        {r.tag ?? t(`journey.roles.${r.id}.tag`)}
                      </span>
                    </span>

                    <span className="relative mt-5 block">
                      <JourneyPathMotif variant={motif} />
                    </span>

                    <span className="relative mt-4 flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="font-display text-[1.35rem] leading-tight tracking-tight text-ink-900 sm:text-xl">
                        {r.title}
                      </span>
                      <span className="text-sm leading-relaxed text-ink-600">{r.body}</span>
                    </span>

                    <span
                      className={`relative mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors ${
                        active || busy
                          ? "bg-mist-700 text-white"
                          : "bg-mist-700/90 text-white group-hover:bg-mist-700"
                      }`}
                    >
                      {busy ? (
                        <JourneyButtonLoader label={t("journey.loading")} onDark />
                      ) : (
                        <>
                          {t("journey.roles.enterPath")}
                          <span
                            aria-hidden
                            className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                          >
                            →
                          </span>
                        </>
                      )}
                    </span>
                  </motion.button>
                </form>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={live ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{
          duration: dur(0.4),
          delay: animate ? 0.22 : 0,
          ease: LUX,
        }}
        className="relative"
      >
        <div className="mb-4 flex items-center gap-3">
          <p className="label-caps mb-0 shrink-0">{t("journey.roles.workspaces")}</p>
          <span aria-hidden className="h-px flex-1 bg-dawn-200" />
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {workspaces.map((r, idx) => {
            const busy = showLoader && picked === r.id;
            return (
              <li key={r.id}>
                <form action={() => submit(r.id)}>
                  <motion.button
                    type="submit"
                    disabled={pending}
                    initial={{ opacity: 0, y: 8 }}
                    animate={live ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                    transition={{
                      duration: dur(0.35),
                      delay: animate ? 0.28 + idx * 0.06 : 0,
                      ease: LUX,
                    }}
                    whileHover={animate && !pending ? { y: -2 } : undefined}
                    whileTap={animate && !pending ? { scale: 0.99 } : undefined}
                    className="group flex h-full min-h-[7.5rem] w-full flex-col items-start gap-2 rounded-xl border border-dawn-200/80 bg-white/55 p-4 text-start backdrop-blur-sm transition-colors hover:border-mist-300 hover:bg-white disabled:opacity-70 sm:p-5"
                  >
                    <span className="flex w-full items-center gap-2.5 text-mist-700">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-dawn-100 text-mist-700">
                        <RoleGlyph id={r.id} />
                      </span>
                      <span className="font-display text-lg tracking-tight text-ink-900">{r.title}</span>
                      <span className="ms-auto hidden rounded-pill bg-dawn-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-400 sm:inline">
                        {r.tag ?? t(`journey.roles.${r.id}.tag`)}
                      </span>
                    </span>
                    <span className="text-sm leading-relaxed text-ink-600">{r.body}</span>
                    <span className="mt-auto pt-1 text-sm font-semibold text-mist-700">
                      {busy ? (
                        <JourneyButtonLoader label={t("journey.loading")} />
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          {t("journey.roles.continue")}
                          <span
                            aria-hidden
                            className="transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                          >
                            →
                          </span>
                        </span>
                      )}
                    </span>
                  </motion.button>
                </form>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
}
