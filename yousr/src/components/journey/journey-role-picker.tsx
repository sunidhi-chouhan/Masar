"use client";

import { useState, useTransition } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import { pickJourneyRole } from "@/server/actions/journey";
import { JourneyPulseDots, useDelayedFlag } from "@/components/journey/journey-loaders";
import { Reveal } from "@/components/ui/motion";

type RoleId = "female" | "male" | "clinician" | "admin";

export function JourneyRolePicker({
  locale,
  roles,
  tone: _tone = "default",
}: {
  locale: string;
  roles: { id: RoleId; title: string; body: string }[];
  /** Reserved for landing embeds; journey always uses the clinical hierarchy. */
  tone?: "default" | "clinical";
}) {
  void _tone;
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [pending, start] = useTransition();
  const [picked, setPicked] = useState<RoleId | null>(null);
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
    <div className="mt-8 space-y-10">
      {/* Primary path — stacked, editorial weight (not equal 2×2 grid) */}
      <Reveal>
        <ul className="space-y-3">
          {people.map((r, idx) => {
            const busy = showLoader && picked === r.id;
            return (
              <li key={r.id}>
                <form action={() => submit(r.id)}>
                  <motion.button
                    type="submit"
                    disabled={pending}
                    whileHover={reduce || pending ? undefined : { x: 2 }}
                    whileTap={reduce || pending ? undefined : { scale: 0.99 }}
                    className={`group flex w-full min-h-[5.5rem] flex-col items-start gap-1 border border-dawn-200 bg-white p-5 text-start transition-colors hover:border-mist-300 hover:bg-mist-100/25 disabled:opacity-70 sm:flex-row sm:items-center sm:gap-6 ${
                      idx === 0 ? "rounded-t-lg" : ""
                    } ${idx === people.length - 1 ? "rounded-b-lg" : ""} ${
                      idx > 0 ? "border-t-0" : ""
                    }`}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-display text-xl tracking-tight text-ink-900">{r.title}</span>
                      <span className="text-sm text-ink-600">{r.body}</span>
                    </span>
                    <span className="mt-2 flex shrink-0 items-center gap-2 text-sm font-semibold text-mist-700 sm:mt-0">
                      {busy ? (
                        <JourneyPulseDots label={t("journey.loading")} />
                      ) : (
                        <>
                          {t("journey.roles.continue")}
                          <span aria-hidden className="transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                            →
                          </span>
                        </>
                      )}
                    </span>
                  </motion.button>
                </form>
              </li>
            );
          })}
        </ul>
      </Reveal>

      {/* Secondary — quieter workspaces */}
      <Reveal delay={0.08}>
        <p className="label-caps mb-3">{t("journey.roles.workspaces")}</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {workspaces.map((r) => {
            const busy = showLoader && picked === r.id;
            return (
              <li key={r.id}>
                <form action={() => submit(r.id)}>
                  <motion.button
                    type="submit"
                    disabled={pending}
                    whileTap={reduce || pending ? undefined : { scale: 0.99 }}
                    className="flex h-full min-h-11 w-full flex-col items-start gap-1 rounded-md border border-dawn-200 bg-transparent p-4 text-start transition-colors hover:border-dawn-300 hover:bg-white/70 disabled:opacity-70"
                  >
                    <span className="font-display text-base text-ink-900">{r.title}</span>
                    <span className="text-xs leading-relaxed text-ink-600">{r.body}</span>
                    <span className="mt-2 text-xs font-semibold text-mist-700">
                      {busy ? <JourneyPulseDots label={t("journey.loading")} /> : `${t("journey.roles.continue")} →`}
                    </span>
                  </motion.button>
                </form>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </div>
  );
}
