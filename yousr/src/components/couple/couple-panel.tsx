"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Confidence, Direction, Domain } from "@/lib/domain/types";
import { saveCoupleScopes } from "@/server/actions/patient";
import { Button, DirectionBadge } from "@/components/ui/atoms";

export interface PartnerView {
  domain: Domain;
  direction: Direction;
  confidence: Confidence;
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
  const [scopes, setScopes] = useState<Domain[]>(myScopes);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="surface-paper p-5">
        <h2 className="text-ink-900">{t("couple.iShare", { name: partnerName })}</h2>
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
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm ${
                    on ? "border-amber-400/60 bg-amber-100/60 text-ink-900" : "border-dawn-200 bg-dawn-50 text-ink-600"
                  }`}
                >
                  <span>{t(`domains.${d}`)}</span>
                  <span
                    aria-hidden
                    className={`h-3 w-3 rounded-pill ${on ? "bg-amber-400 shadow-[0_0_10px_var(--amber-400)]" : "bg-slate-400"}`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex items-center gap-3">
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                await saveCoupleScopes(scopes);
                setSaved(true);
              })
            }
          >
            {t("couple.save")}
          </Button>
          {saved ? <span className="text-sm text-mist-700">{t("couple.saved")}</span> : null}
        </div>
      </section>

      <section className="surface-paper p-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-8 w-8 rounded-pill"
            style={{ background: `radial-gradient(circle at 35% 35%, hsl(${partnerHue} 70% 85%), hsl(${partnerHue} 45% 60%))` }}
          />
          <h2 className="text-ink-900">{t("couple.theyShare", { name: partnerName })}</h2>
        </div>
        {!partnerSharingOn ? (
          <p className="mt-4 text-sm text-slate-600">{t("couple.partnerOff", { name: partnerName })}</p>
        ) : partnerShares.length ? (
          <ul className="mt-4 space-y-2">
            {partnerShares.map((p) => (
              <li key={p.domain} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dawn-200 bg-dawn-50 px-3 py-2 text-sm">
                <span className="text-ink-900">{t(`domains.${p.domain}`)}</span>
                <DirectionBadge direction={p.direction} confidence={p.confidence} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink-400">{t("couple.notShared")}</p>
        )}
      </section>
    </div>
  );
}
