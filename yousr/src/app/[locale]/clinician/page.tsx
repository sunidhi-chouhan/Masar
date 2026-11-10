import Link from "next/link";
import { requireRole } from "@/lib/page-context";
import { clinicianQueue } from "@/server/clinician";
import { ageFromBirthYear } from "@/lib/domain/types";
import { formatDate } from "@/lib/i18n/format";
import { Page } from "@/components/ui/atoms";

const ACTIVE_STATES = ["Requested", "Confirmed", "Attended"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default async function ClinicianQueuePage({ params }: PageProps<"/[locale]/clinician">) {
  const { locale, t, session } = await requireRole(params, ["clinician"]);
  const rows = await clinicianQueue({ userId: session.userId, role: session.role });
  const name = locale === "ar" ? session.nameAr : session.name;

  const needingReview = rows.filter((r) => r.consented && r.discussDomains.length > 0).length;
  const locked = rows.filter((r) => !r.consented).length;
  const inFlight = rows.filter((r) => r.consented && r.counselState && ACTIVE_STATES.includes(r.counselState)).length;
  const oldest = rows
    .filter((r) => r.consented && r.oldestSignalAt)
    .map((r) => r.oldestSignalAt as Date)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  // Worklist order: open signals first (oldest first), then quiet, then locked.
  const ordered = [...rows].sort((a, b) => {
    const rank = (r: (typeof rows)[number]) => (!r.consented ? 2 : r.discussDomains.length ? 0 : 1);
    return (
      rank(a) - rank(b) ||
      (a.oldestSignalAt?.getTime() ?? Infinity) - (b.oldestSignalAt?.getTime() ?? Infinity)
    );
  });

  const kpis = [
    { label: t("clinician.kpis.review"), value: String(needingReview), tone: "bg-amber-400" },
    { label: t("clinician.kpis.inFlight"), value: String(inFlight), tone: "bg-mist-500" },
    { label: t("clinician.kpis.oldest"), value: oldest ? formatDate(oldest, locale) : "—", tone: "bg-peach-500", small: true },
    { label: t("clinician.kpis.locked"), value: String(locked), tone: "bg-slate-400" },
  ];

  return (
    <Page wide>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-dawn-200/80 pb-7">
        <div>
          <p className="label-caps">{t("clinician.workspace")}</p>
          <h1 className="mt-2 text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.05] text-ink-900">
            {t("clinician.greeting", { name })}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink-600">{t("clinician.queueSubtitle")}</p>
        </div>
      </header>

      <dl className="card mt-6 grid grid-cols-2 divide-dawn-200/70 overflow-hidden lg:grid-cols-4 lg:divide-x rtl:lg:divide-x-reverse">
        {kpis.map((k) => (
          <div key={k.label} className="border-dawn-200/70 p-5 [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0">
            <dt className="flex items-center gap-2 text-[12.5px] text-ink-500">
              <span aria-hidden className={`dot ${k.tone}`} />
              {k.label}
            </dt>
            <dd className={`mt-2 tabular-nums text-ink-900 ${k.small ? "text-xl font-semibold" : "font-display text-4xl leading-none"}`}>
              {k.value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dawn-200/70 px-5 py-4">
          <h2 className="text-[1.3rem] text-ink-900">{t("clinician.queueTitle")}</h2>
          <p className="text-[12.5px] text-ink-500">{rows.length}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-dawn-200/70 bg-dawn-50/70 text-[11.5px] uppercase tracking-[0.08em] text-ink-500">
                <th className="px-5 py-3 text-start font-semibold">{t("clinician.cols.person")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("clinician.intention")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("clinician.cols.signals")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("clinician.cols.oldest")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("clinician.cols.counsel")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("clinician.cols.lastReview")}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-dawn-200/60">
              {ordered.map((r) => {
                const display = locale === "ar" ? r.nameAr : r.name;
                const open = r.consented && r.discussDomains.length > 0;
                return (
                  <tr key={r.userId} className="group transition-colors hover:bg-dawn-50/80">
                    <td className="relative px-5 py-4">
                      {open ? <span aria-hidden className="absolute inset-y-3 start-0 w-[3px] rounded-full bg-amber-400" /> : null}
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold ${
                            r.consented ? "bg-mist-100 text-mist-700" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {r.consented ? initials(r.name) : "•••"}
                        </span>
                        <div>
                          <p className="font-medium text-ink-900">{display}</p>
                          <p className="text-[12px] text-ink-500">
                            {t("common.age", { age: ageFromBirthYear(r.birthYear) })} · {r.sex}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-ink-700">{r.consented ? t(`intentions.${r.intention}`) : "—"}</td>
                    <td className="px-4 py-4">
                      {!r.consented ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-400/70 px-2.5 py-0.5 text-xs text-slate-600">
                          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden>
                            <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                            <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.4" />
                          </svg>
                          {t("clinician.locked")}
                        </span>
                      ) : r.discussDomains.length ? (
                        <span className="flex flex-wrap gap-1.5">
                          {r.discussDomains.map((d) => (
                            <span
                              key={d}
                              className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-400/40"
                            >
                              <span aria-hidden className="dot bg-amber-400" />
                              {t(`domains.short.${d}`)}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-400">{t("clinician.noSignals")}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 tabular-nums text-ink-700">
                      {r.oldestSignalAt ? formatDate(r.oldestSignalAt, locale) : "—"}
                    </td>
                    <td className="px-4 py-4">
                      {r.counselState ? (
                        <span className="inline-flex items-center gap-1.5 text-ink-700">
                          <span
                            aria-hidden
                            className={`dot ${ACTIVE_STATES.includes(r.counselState) ? "bg-mist-500" : r.counselState === "OutcomeRecorded" ? "bg-mist-300" : "bg-dawn-300"}`}
                          />
                          {t(`actions.states.${r.counselState}`)}
                        </span>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 tabular-nums text-ink-700">
                      {r.lastReviewAt ? formatDate(r.lastReviewAt, locale) : "—"}
                    </td>
                    <td className="px-5 py-4 text-end">
                      <Link
                        href={`/${locale}/clinician/patients/${r.userId}`}
                        className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors ${
                          r.consented
                            ? "bg-mist-700 text-white hover:bg-mist-600"
                            : "border border-dawn-300 text-ink-500 hover:border-dawn-400"
                        }`}
                      >
                        {t("clinician.open")}
                        <span aria-hidden className="rtl:-scale-x-100">→</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </Page>
  );
}
