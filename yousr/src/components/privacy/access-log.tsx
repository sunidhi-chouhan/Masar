"use client";

import { useI18n } from "@/lib/i18n/client";
import { formatDate } from "@/lib/i18n/format";

export interface AuditRow {
  id: string;
  type: string;
  resource: string;
  detail: string | null;
  allowed: boolean;
  createdAt: string;
  actorName: string | null;
  actorNameAr: string | null;
  actorRole: string;
}

export function AccessLog({ rows }: { rows: AuditRow[] }) {
  const { t, locale } = useI18n();
  if (!rows.length) {
    return (
      <p className="rounded-[1.25rem] border border-dashed border-dawn-300 bg-dawn-50/60 px-4 py-6 text-center text-sm text-ink-400">
        {t("privacy.logEmpty")}
      </p>
    );
  }
  return (
    <ol className="relative space-y-0 border-s-2 border-dawn-200 ms-3 ps-5">
      {rows.map((r) => {
        const who = r.actorName
          ? locale === "ar"
            ? r.actorNameAr
            : r.actorName
          : t("privacy.system");
        const tone = !r.allowed
          ? "bg-slate-400"
          : r.type === "ConsentChange"
            ? "bg-amber-400"
            : r.type === "Review" || r.type === "View"
              ? "bg-mist-500"
              : "bg-peach-300";
        return (
          <li key={r.id} className="relative pb-4 last:pb-0">
            <span
              aria-hidden
              className={`absolute -start-[1.4rem] top-2.5 h-3 w-3 rounded-pill ring-4 ring-dawn-50 ${tone}`}
            />
            <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-[var(--shadow-soft)] ring-1 ring-dawn-200/50">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-ink-900">
                  <span className="font-medium">{t(`privacy.auditTypes.${r.type}`)}</span>
                  <span className="text-ink-400"> · {r.resource}</span>
                  {r.detail ? (
                    <span className="text-ink-600"> · {r.detail.replace(/_/g, " ")}</span>
                  ) : null}
                </p>
                {!r.allowed ? (
                  <span className="shrink-0 rounded-full border border-slate-400 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-600">
                    {t("privacy.auditTypes.BlockedAccess")}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-ink-400">
                {t("privacy.by", { name: who ?? "" })} ·{" "}
                {formatDate(r.createdAt, locale, { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
