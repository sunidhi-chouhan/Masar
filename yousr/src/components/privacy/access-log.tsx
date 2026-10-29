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
  if (!rows.length) return <p className="text-sm text-ink-400">{t("privacy.logEmpty")}</p>;
  return (
    <ol className="divide-y divide-dawn-200 rounded-lg border border-dawn-200 bg-dawn-50/60">
      {rows.map((r) => {
        const who = r.actorName ? (locale === "ar" ? r.actorNameAr : r.actorName) : t("privacy.system");
        const tone = !r.allowed ? "bg-slate-400" : r.type === "ConsentChange" ? "bg-amber-400" : r.type === "Review" || r.type === "View" ? "bg-mist-500" : "bg-peach-300";
        return (
          <li key={r.id} className="flex items-start gap-3 px-4 py-3 text-sm">
            <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-pill ${tone}`} />
            <div className="min-w-0 flex-1">
              <p className="text-ink-900">
                <span className="font-medium">{t(`privacy.auditTypes.${r.type}`)}</span>
                <span className="text-ink-400"> · {r.resource}</span>
                {r.detail ? <span className="text-ink-600"> · {r.detail.replace(/_/g, " ")}</span> : null}
              </p>
              <p className="text-xs text-ink-400">
                {t("privacy.by", { name: who ?? "" })} · {formatDate(r.createdAt, locale, { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {!r.allowed ? (
              <span className="shrink-0 rounded-sm border border-slate-400 px-1.5 text-[11px] uppercase tracking-wide text-slate-600">
                {t("privacy.auditTypes.BlockedAccess")}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
