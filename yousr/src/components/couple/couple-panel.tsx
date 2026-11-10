"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import type { Confidence, Direction, Domain } from "@/lib/domain/types";
import { saveCoupleScopes } from "@/server/actions/patient";
import { Button, DirectionBadge } from "@/components/ui/atoms";
import { JourneyButtonLoader, useJourneyMotion } from "@/components/journey/journey-loaders";
import { DomainSphere } from "@/components/trajectory/section-figures";

export interface PartnerView {
  domain: Domain;
  direction: Direction;
  confidence: Confidence;
}

function DualOrbs({
  partnerHue,
  partnerName,
}: {
  partnerHue: number;
  partnerName: string;
}) {
  const { animate } = useJourneyMotion();
  return (
    <div className="mb-6 flex items-center justify-center gap-2" aria-hidden>
      <motion.div
        animate={animate ? { y: [0, -3, 0] } : undefined}
        transition={animate ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" } : undefined}
        className="relative"
      >
        <DomainSphere domain="cycle" direction="Stable" size={64} />
      </motion.div>
      <span className="h-px w-8 bg-dawn-300" />
      <motion.div
        animate={animate ? { y: [0, 3, 0] } : undefined}
        transition={
          animate ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 } : undefined
        }
        className="relative flex h-16 w-16 items-center justify-center"
        title={partnerName}
      >
        <span
          className="absolute inset-0 rounded-full opacity-90"
          style={{
            background: `radial-gradient(circle at 35% 30%, hsl(${partnerHue} 70% 90%), hsl(${partnerHue} 45% 58%))`,
          }}
        />
        <span className="absolute start-3 top-3 h-3 w-3 rounded-full bg-white/50" />
      </motion.div>
    </div>
  );
}

export function CouplePanel({
  myDomains,
  myScopes,
  partnerName,
  partnerShares,
  partnerSharingOn,
  partnerHue,
}: {
  myDomains: Domain[];
  myScopes: Domain[];
  partnerName: string;
  partnerShares: PartnerView[];
  partnerSharingOn: boolean;
  partnerHue: number;
}) {
  const { t } = useI18n();
  const { animate } = useJourneyMotion();
  const [scopes, setScopes] = useState<Domain[]>(myScopes);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <DualOrbs partnerHue={partnerHue} partnerName={partnerName} />
      <div className="grid gap-5 md:grid-cols-2">
        <section className="overflow-hidden card p-5">
          <h2 className="font-display text-xl tracking-tight text-ink-900">
            {t("couple.iShare", { name: partnerName })}
          </h2>
          <ul className="mt-4 space-y-2">
            {myDomains.map((d) => {
              const on = scopes.includes(d);
              return (
                <li key={d}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => {
                      setSaved(false);
                      setScopes((s) => (on ? s.filter((x) => x !== d) : [...s, d]));
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm transition-colors ${
                      on
                        ? "bg-amber-100/70 text-ink-900 ring-1 ring-amber-300/50"
                        : "bg-dawn-50 text-ink-600 ring-1 ring-dawn-200/60"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <DomainSphere domain={d} direction={on ? "Stable" : "Unknown"} size={28} />
                      {t(`domains.${d}`)}
                    </span>
                    <span
                      aria-hidden
                      className={`h-3 w-3 rounded-pill ${
                        on ? "bg-amber-400 shadow-[0_0_10px_var(--amber-400)]" : "bg-slate-400"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-center gap-3">
            <Button
              disabled={pending}
              className="min-w-[7rem]"
              onClick={() =>
                start(async () => {
                  await saveCoupleScopes(scopes);
                  setSaved(true);
                })
              }
            >
              {pending ? (
                <JourneyButtonLoader label={t("journey.saving")} onDark withLabel={false} />
              ) : (
                t("couple.save")
              )}
            </Button>
            {saved ? <span className="text-sm text-mist-700">{t("couple.saved")}</span> : null}
          </div>
        </section>

        <section className="overflow-hidden card p-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="h-10 w-10 rounded-pill shadow-[var(--shadow-soft)]"
              style={{
                background: `radial-gradient(circle at 35% 35%, hsl(${partnerHue} 70% 85%), hsl(${partnerHue} 45% 60%))`,
              }}
            />
            <h2 className="font-display text-xl tracking-tight text-ink-900">
              {t("couple.theyShare", { name: partnerName })}
            </h2>
          </div>
          {!partnerSharingOn ? (
            <div className="mt-5 rounded-2xl border border-dashed border-dawn-300 bg-dawn-50/60 px-4 py-5 text-center">
              <p className="text-sm text-slate-600">{t("couple.partnerOff", { name: partnerName })}</p>
            </div>
          ) : partnerShares.length ? (
            <ul className="mt-4 space-y-2">
              {partnerShares.map((p) => (
                <motion.li
                  key={p.domain}
                  whileHover={animate ? { y: -1 } : undefined}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-dawn-50/90 px-3.5 py-2.5 text-sm"
                >
                  <span className="flex items-center gap-2.5 font-medium text-ink-900">
                    <DomainSphere domain={p.domain} direction={p.direction} size={28} />
                    {t(`domains.${p.domain}`)}
                  </span>
                  <DirectionBadge direction={p.direction} confidence={p.confidence} compact />
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-ink-400">{t("couple.notShared")}</p>
          )}
        </section>
      </div>
    </div>
  );
}
