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
      className="overflow-hidden rounded-[18px] border border-dawn-200 bg-dawn-50 p-5 md:p-6"
    >
      <h2 id="firewall-h" className="text-[1.35rem] text-ink-900">
        {t("privacy.firewall.title")}
      </h2>
      <p className="mt-1 text-sm text-ink-600">{t("privacy.firewall.body")}</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {blocked.map((b) => (
          <li
            key={b}
            className="flex items-center gap-3 rounded-xl border border-dawn-200 bg-white px-3.5 py-3"
          >
            <span
              aria-hidden
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-peach-200 text-peach-700"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" /><path d="M4.2 11.8 11.8 4.2" stroke="currentColor" strokeWidth="1.5" /></svg>
            </span>
            <span className="text-[13.5px] font-medium text-ink-700">
              {t(`privacy.firewall.${b}`)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
