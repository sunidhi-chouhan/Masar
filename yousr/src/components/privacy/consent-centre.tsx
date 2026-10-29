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
        <div className="grid gap-3">
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
        <div className="grid gap-3">
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
    <section aria-labelledby="firewall-h" className="rounded-lg border border-slate-200 bg-slate-200/30 p-5">
      <h2 id="firewall-h" className="text-ink-900">
        {t("privacy.firewall.title")}
      </h2>
      <p className="mt-1 text-sm text-ink-600">{t("privacy.firewall.body")}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {blocked.map((b) => (
          <li key={b} className="flex items-center gap-3 rounded-md border border-slate-200 bg-dawn-50/70 p-3">
            <span
              aria-hidden
              className="relative h-9 w-9 shrink-0 rounded-pill bg-slate-200"
              style={{ boxShadow: "inset 0 0 0 2px var(--slate-400)" }}
            >
              <span className="absolute inset-0 m-auto h-[2px] w-6 rotate-45 bg-slate-600" style={{ top: "50%" }} />
            </span>
            <span className="text-sm text-slate-600 line-through decoration-slate-400">{t(`privacy.firewall.${b}`)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
