"use client";

import { useI18n } from "@/lib/i18n/client";
import { DATA_SOURCES, type DataSourceId } from "@/lib/domain/types";
import type { ConsentState } from "@/server/consent";
import { toggleRecipient, toggleSource } from "@/server/actions/patient";
import { LanternToggle } from "./lantern-toggle";
import { SectionHeading } from "@/components/ui/atoms";

const RECIPIENTS = ["Clinician", "Partner", "Analytics"] as const;

export function ConsentCentre({ state, hasPartner }: { state: ConsentState; hasPartner: boolean }) {
  const { t } = useI18n();
  return (
    <div className="space-y-10">
      <section aria-labelledby="sources-h">
        <SectionHeading title={t("privacy.sourcesHeading")} body={t("privacy.sourcesBody")} />
        <div className="mt-4 grid gap-3">
          {DATA_SOURCES.map((s: DataSourceId) => (
            <LanternToggle
              key={s}
              id={`src-${s}`}
              label={t(`privacy.sources.${s}`)}
              hint={t(`privacy.sourceHints.${s}`)}
              on={state.sources[s]}
              simulated={s !== "SelfReport"}
              onToggle={(on) => toggleSource(s, on)}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="recipients-h">
        <SectionHeading title={t("privacy.whoCanSee")} body={t("privacy.whoCanSeeBody")} />
        <div className="mt-4 grid gap-3">
          {RECIPIENTS.filter((r) => r !== "Partner" || hasPartner).map((r) => (
            <LanternToggle
              key={r}
              id={`rcp-${r}`}
              label={t(`privacy.recipients.${r}`)}
              hint={t(`privacy.recipientHints.${r}`)}
              on={state.recipients[r]}
              onToggle={(on) => toggleRecipient(r, on)}
            />
          ))}
        </div>
      </section>

      <PurposeFirewall />
    </div>
  );
}

/** Three sealed lanterns. No toggle exists, because no purpose exists in the system. */
export function PurposeFirewall() {
  const { t } = useI18n();
  const blocked = ["employer", "insurer", "unrelated"] as const;
  return (
    <section
      aria-labelledby="firewall-h"
      className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-200/40 to-dawn-50 p-5 shadow-[var(--shadow-soft)] md:p-6"
    >
      <h2 id="firewall-h" className="font-display text-xl tracking-tight text-ink-900">
        {t("privacy.firewall.title")}
      </h2>
      <p className="mt-1 text-sm text-ink-600">{t("privacy.firewall.body")}</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {blocked.map((b) => (
          <li
            key={b}
            className="flex items-center gap-3 rounded-[1.25rem] bg-white/80 p-3.5 ring-1 ring-slate-200/80"
          >
            <span
              aria-hidden
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-slate-200"
            >
              <span className="absolute h-[2px] w-7 rotate-45 bg-slate-600" />
              <span className="h-6 w-6 rounded-pill border-2 border-slate-400" />
            </span>
            <span className="text-sm text-slate-600 line-through decoration-slate-400">
              {t(`privacy.firewall.${b}`)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
