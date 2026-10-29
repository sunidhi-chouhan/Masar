import Link from "next/link";
import { requireRole } from "@/lib/page-context";
import { clinicianQueue } from "@/server/clinician";
import { ageFromBirthYear } from "@/lib/domain/types";
import { formatDate } from "@/lib/i18n/format";
import { Page } from "@/components/ui/atoms";

export default async function ClinicianQueuePage({ params }: PageProps<"/[locale]/clinician">) {
  const { locale, t, session } = await requireRole(params, ["clinician"]);
  const rows = await clinicianQueue({ userId: session.userId, role: session.role });
  const name = locale === "ar" ? session.nameAr : session.name;

  const needingReview = rows.filter((r) => r.consented && r.discussDomains.length > 0).length;
  const locked = rows.filter((r) => !r.consented).length;
  const inFlight = rows.filter((r) => r.consented && r.counselState && !["Declined", "Expired", "OutcomeRecorded", "Suggested"].includes(r.counselState)).length;
  const oldest = rows
    .filter((r) => r.consented && r.oldestSignalAt)
    .map((r) => r.oldestSignalAt as Date)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return (
    <Page wide>
      <p className="label-caps">{t("clinician.workspace")}</p>
      <h1 className="mt-1 text-ink-900">{t("clinician.greeting", { name })}</h1>
      <p className="mt-2 max-w-2xl text-ink-600">{t("clinician.queueSubtitle")}</p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <li className="surface-paper p-4">
          <p className="label-caps">{t("clinician.kpis.review")}</p>
          <p className="mt-1 font-display text-3xl text-ink-900">{needingReview}</p>
        </li>
        <li className="surface-paper p-4">
          <p className="label-caps">{t("clinician.kpis.inFlight")}</p>
          <p className="mt-1 font-display text-3xl text-ink-900">{inFlight}</p>
        </li>
        <li className="surface-paper p-4">
          <p className="label-caps">{t("clinician.kpis.oldest")}</p>
          <p className="mt-1 text-lg font-semibold text-ink-900">{oldest ? formatDate(oldest, locale) : "—"}</p>
        </li>
        <li className="surface-paper p-4">
          <p className="label-caps">{t("clinician.kpis.locked")}</p>
          <p className="mt-1 font-display text-3xl text-ink-900">{locked}</p>
        </li>
      </ul>

      <div className="mt-8 overflow-x-auto rounded-lg border border-dawn-200 bg-white">
        <table className="w-full text-sm">
          <thead className="text-start">
            <tr className="border-b border-dawn-200 bg-dawn-50 text-xs text-ink-600">
              <th className="px-4 py-3 text-start font-normal">{t("clinician.cols.person")}</th>
              <th className="px-4 py-3 text-start font-normal">{t("clinician.intention")}</th>
              <th className="px-4 py-3 text-start font-normal">{t("clinician.cols.signals")}</th>
              <th className="px-4 py-3 text-start font-normal">{t("clinician.cols.oldest")}</th>
              <th className="px-4 py-3 text-start font-normal">{t("clinician.cols.counsel")}</th>
              <th className="px-4 py-3 text-start font-normal">{t("clinician.cols.lastReview")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className={`border-b border-dawn-200 last:border-0 ${r.consented ? "" : "opacity-70"}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{locale === "ar" ? r.nameAr : r.name}</p>
                  <p className="text-xs text-ink-400">
                    {t("common.age", { age: ageFromBirthYear(r.birthYear) })} · {r.sex}
                  </p>
                </td>
                <td className="px-4 py-3 text-ink-600">{r.consented ? t(`intentions.${r.intention}`) : "—"}</td>
                <td className="px-4 py-3">
                  {!r.consented ? (
                    <span className="inline-flex items-center gap-1 rounded-sm border border-slate-400 px-1.5 py-0.5 text-xs text-slate-600">
                      {t("clinician.locked")}
                    </span>
                  ) : r.discussDomains.length ? (
                    <span className="flex flex-wrap gap-1">
                      {r.discussDomains.map((d) => (
                        <span key={d} className="rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                          {t(`domains.${d}`)}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-400">{t("clinician.noSignals")}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-600">{r.oldestSignalAt ? formatDate(r.oldestSignalAt, locale) : "—"}</td>
                <td className="px-4 py-3 text-ink-600">{r.counselState ? t(`actions.states.${r.counselState}`) : "—"}</td>
                <td className="px-4 py-3 text-ink-600">{r.lastReviewAt ? formatDate(r.lastReviewAt, locale) : "—"}</td>
                <td className="px-4 py-3 text-end">
                  <Link
                    href={`/${locale}/clinician/patients/${r.userId}`}
                    className={`rounded-md px-3 py-1.5 text-xs ${r.consented ? "bg-mist-700 text-white hover:bg-mist-500" : "border border-slate-400 text-slate-600"}`}
                  >
                    {t("clinician.open")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
