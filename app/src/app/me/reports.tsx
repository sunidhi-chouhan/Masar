import { AskButton } from "@/components/companion";
import { ReportUpload } from "@/components/report-upload";
import { SubmitButton } from "@/components/submit-button";
import { Pill } from "@/components/ui";
import type { Lang, Vars } from "@/lib/i18n";
import { confirmReport } from "@/server/actions";
import type { ReportRequest } from "@/server/store";

/** Test results the doctor asked for: upload, check what was read, done. */
export function Reports({
  personId,
  reports,
  t,
  fmt,
  lang,
  aiReads,
}: {
  aiReads: boolean;
  personId: string;
  reports: ReportRequest[];
  t: (text: string, vars?: Vars) => string;
  fmt: (iso: string) => string;
  lang: Lang;
}) {
  if (!reports.length) return null;
  return (
    <section className="reveal mt-10">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-[1.35rem] font-semibold tracking-[-0.02em] text-zinc-950">{t("Results your doctor asked for")}</h2>
        <p className="hidden text-[13px] text-zinc-500 sm:block">{t("Only you and Dr Layla can open these files.")}</p>
      </div>
      <div className="grid gap-4">
        {reports.map((r) => (
          <article key={r.id} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[16px] font-semibold text-zinc-950">{t(r.test)}</p>
                <p className="mt-0.5 text-[13px] text-zinc-500">{t("Asked by Dr Layla Al Hashimi on {date}", { date: fmt(r.requestedAt) })}</p>
              </div>
              <Pill tone={r.status === "requested" ? "gold" : r.status === "uploaded" ? "slate" : "pine"}>
                {r.status === "requested" ? t("Waiting for you") : r.status === "uploaded" ? t("Please check") : t("Sent to your doctor")}
              </Pill>
            </div>
            {r.note ? <p className="mt-3 rounded-xl bg-zinc-50 px-4 py-3 text-[14px] text-zinc-700">&ldquo;{r.note}&rdquo;</p> : null}

            {r.status === "requested" ? <ReportUpload reportId={r.id} lang={lang} aiReads={aiReads} /> : null}

            {r.status !== "requested" && r.forPerson ? (
              <div className="mt-4 flex gap-3 rounded-2xl bg-indigo-50/70 p-4">
                <span aria-hidden className="orb mt-0.5" style={{ width: 22, height: 22 }}>
                  <span className="orb__core" />
                </span>
                <div>
                  <p className="text-[14px] leading-relaxed text-indigo-950">{t(r.forPerson)}</p>
                  <p className="mt-1 text-[11.5px] text-indigo-900/70">
                    {r.readBy === "ai" ? t("Read automatically by Masar's assistant (Google Gemini). Check it against your file.") : t("Masar's own words")}
                  </p>
                </div>
              </div>
            ) : null}

            {r.status === "uploaded" ? (
              <form action={confirmReport.bind(null, r.id)} className="mt-4">
                {r.values?.length ? (
                  <>
                    <p className="text-[14px] font-semibold text-zinc-950">{t("Is this what your report says?")}</p>
                    <p className="text-[13px] text-zinc-500">{t("Untick anything that's wrong. Only what you keep is added to your record.")}</p>
                    <ul className="mt-3 divide-y divide-zinc-200/70 rounded-2xl border border-zinc-200">
                      {r.values.map((v, i) => (
                        <li key={i}>
                          <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5">
                            <input type="checkbox" name={`keep_${i}`} defaultChecked className="h-4 w-4 accent-indigo-600" />
                            <span className="flex-1 text-[14px] text-zinc-800">{v.name}</span>
                            <span className="tabular text-[14px] font-semibold text-zinc-950" dir="ltr">
                              {v.value} <span className="font-normal text-zinc-500">{v.unit}</span>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-[14px] text-zinc-600">
                    {r.readBy === "ai" ? t("We couldn't read any values from this file, but your doctor can open it.") : t("Your doctor will read the file themselves.")}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <SubmitButton pendingLabel={t("Saving")} className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                    {r.values?.length ? t("Yes, these are right") : t("Send to my doctor")}
                  </SubmitButton>
                  <a href={`/api/reports/${personId}/${r.id}`} target="_blank" className="text-[13.5px] font-medium text-indigo-600 hover:underline">
                    {t("Open my file")}
                  </a>
                </div>
              </form>
            ) : null}

            {r.status === "confirmed" ? (
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px]">
                {r.values?.map((v, i) => (
                  <span key={i} className="text-zinc-700">
                    {v.name}:{" "}
                    <span className="tabular font-semibold text-zinc-950" dir="ltr">
                      {v.value} {v.unit}
                    </span>
                    {v.code ? <span className="ms-1.5 text-[12px] text-indigo-600">{t("added to your record")}</span> : null}
                  </span>
                ))}
                <a href={`/api/reports/${personId}/${r.id}`} target="_blank" className="font-medium text-indigo-600 hover:underline">
                  {t("Open my file")}
                </a>
                <AskButton text={t("What does my {test} mean?", { test: t(r.test).toLowerCase() })} className="font-medium text-indigo-600 hover:underline">
                  {t("Ask what it means")}
                </AskButton>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
