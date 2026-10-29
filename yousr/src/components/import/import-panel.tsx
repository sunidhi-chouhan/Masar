"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";
import type { DataSourceId, Sex } from "@/lib/domain/types";
import { runImport, type ImportKind } from "@/server/actions/patient";
import { Button, SimulatedBadge } from "@/components/ui/atoms";

const KINDS: { kind: ImportKind; source: DataSourceId; sexes: Sex[] }[] = [
  { kind: "lab_amh", source: "LabMock", sexes: ["female"] },
  { kind: "lab_tsh", source: "LabMock", sexes: ["female", "male"] },
  { kind: "lab_hba1c", source: "LabMock", sexes: ["female", "male"] },
  { kind: "lab_semen", source: "LabMock", sexes: ["male"] },
  { kind: "device_sleep", source: "DeviceMock", sexes: ["female", "male"] },
  { kind: "malaffi_bmi", source: "MalaffiMock", sexes: ["female", "male"] },
  { kind: "healthage", source: "HealthAgeMock", sexes: ["female", "male"] },
];

export function ImportPanel({ sex, lastSync }: { sex: Sex; lastSync: Partial<Record<DataSourceId, string | null>> }) {
  const { t, locale } = useI18n();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-ink-900">{t("import.title")}</h2>
        <SimulatedBadge />
      </div>
      <p className="mt-1 text-sm text-ink-600">{t("import.body")}</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {KINDS.filter((k) => k.sexes.includes(sex)).map((k) => (
          <li key={k.kind} className="flex items-center justify-between gap-3 rounded-md border border-dawn-200 bg-dawn-50 px-3 py-2 text-sm">
            <div>
              <p className="text-ink-900">{t(`import.${k.kind}`)}</p>
              <p className="text-xs text-ink-400">
                {t("import.lastSync", { date: lastSync[k.source] ? formatDate(lastSync[k.source], locale) : t("import.never") })}
              </p>
            </div>
            <Button
              tone="secondary"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await runImport(k.kind);
                  const source = t(`privacy.sources.${r.source}`);
                  setMsg(
                    r.status === "ok"
                      ? t("import.done", { n: r.added, source })
                      : r.status === "blocked"
                        ? t("import.blocked", { source })
                        : r.status === "duplicate"
                          ? t("import.duplicate", { source })
                          : "—",
                  );
                })
              }
            >
              {t("actions.buttons.open")}
            </Button>
          </li>
        ))}
      </ul>
      {msg ? (
        <p className="mt-3 text-sm text-ink-900" aria-live="polite">
          {msg}
        </p>
      ) : null}
    </section>
  );
}
