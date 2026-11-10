import { DeleteData } from "@/components/delete-data";
import { Pill, SectionTitle, Shell } from "@/components/ui";
import { SOURCES } from "@/lib/model";
import { setScanning, setSharing, setSource } from "@/server/actions";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/session";
import { accessLog } from "@/server/store";
import { personView } from "@/server/views";
import { translator } from "@/server/lang";
import { formatDateIn } from "@/lib/i18n";

// Per-user page: it reads the session on every request, so it is never prerendered.
export const instant = false;

function Row({ title, detail, on, action, onLabel, offLabel }: { title: string; detail: string; on: boolean; action: () => Promise<void>; onLabel: string; offLabel: string }) {
  return (
    <form action={action} className={`flex items-center gap-4 rounded-2xl border bg-white px-5 py-4 ${on ? "border-indigo-200" : "border-zinc-200"}`}>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-zinc-950">{title}</p>
        <p className="mt-0.5 text-[13px] text-zinc-500">{detail}</p>
      </div>
      <span className={`hidden text-[12.5px] font-medium sm:inline ${on ? "text-indigo-600" : "text-zinc-400"}`}>{on ? onLabel : offLabel}</span>
      <button
        role="switch"
        aria-checked={on}
        aria-label={title}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-indigo-600" : "bg-zinc-300"}`}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </form>
  );
}

export default async function MyData() {
  const session = await requireRole("person");
  const v = personView(session.id);
  // Nothing to edit until the person has chosen what to share.
  if (!v.state.onboarded) redirect("/me");
  const log = accessLog(session.id);
  const { t, lang } = await translator();
  const toggle = { onLabel: t("On"), offLabel: t("Off") };

  return (
    <Shell session={session}>
      <p className="eyebrow">{t("My data")}</p>
      <h1 className="mt-3 font-semibold tracking-[-0.025em] text-[clamp(2.2rem,4vw,3rem)] leading-[1.05] text-zinc-950">{t("You decide what Masar uses, and who sees it.")}</h1>
      <p className="mt-3 max-w-2xl text-[15px] text-zinc-600">{t("Changes take effect immediately on the server, and every change and every look is written below.")}</p>

      <section className="mt-12">
        <SectionTitle title={t("Sources")} body={t("Each one separately. Switching one off removes its facts from your path and from anything your doctor sees.")} />
        <div className="space-y-2.5">
          {SOURCES.map((s) => (
            <Row key={s.id} {...toggle} title={t(s.label)} detail={t(s.detail)} on={v.state.sources[s.id]} action={setSource.bind(null, s.id, !v.state.sources[s.id])} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionTitle title={t("Who can see your summary")} />
        <div className="space-y-2.5">
          <Row
            {...toggle}
            title={t("My family doctor")}
            detail={t("Dr Layla Al Hashimi can review your summary and your requests")}
            on={v.state.shareWithClinician}
            action={setSharing.bind(null, !v.state.shareWithClinician)}
          />
          <Row
            {...toggle}
            title={t("Keep an eye out for me")}
            detail={t("When your records change, Masar checks whether anything is worth a conversation")}
            on={v.state.scanning}
            action={setScanning.bind(null, !v.state.scanning)}
          />
        </div>
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-100 p-5">
          <p className="text-[14px] font-semibold text-zinc-950">{t("Never, by design")}</p>
          <p className="mt-1 text-[13.5px] text-zinc-600">{t("There is no setting that gives these access, because the purpose does not exist in Masar.")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Employers", "Insurers", "Marketing and unrelated apps"].map((x) => (
              <Pill key={x} tone="clay">
                {t(x)}
              </Pill>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <SectionTitle title={t("Access log")} body={t("Every choice you made, and every time someone looked, allowed or blocked.")} />
        {log.length ? (
          <ul className="card divide-y divide-zinc-200/70">
            {log.map((a, i) => (
              <li key={a.at + i} className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-[14px]">
                <Pill tone={a.allowed ? "pine" : "clay"}>{a.allowed ? t("Allowed") : t("Blocked")}</Pill>
                <span className="font-medium text-zinc-950">{t(a.who)}</span>
                <span className="text-zinc-600">{t(a.what)}</span>
                <span className="ms-auto text-[12.5px] text-zinc-400">
                  {formatDateIn(lang, a.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card p-5 text-[14px] text-zinc-600">{t("Nothing recorded yet.")}</p>
        )}
      </section>

      <section className="mt-12">
        <SectionTitle title={t("Your copy, or none at all")} body={t("Under the UAE data protection law you can have a copy of your data, or have it deleted.")} />
        <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-zinc-950">{t("Download my data")}</p>
            <p className="mt-0.5 text-[13.5px] text-zinc-600">{t("Your choices, answers, what Masar found, your requests and this log, in one file.")}</p>
            <a href="/api/me/export" className="mt-3 inline-block rounded-full bg-zinc-950 px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-indigo-700">
              {t("Download")}
            </a>
          </div>
          <div className="flex-1 border-t border-zinc-200 pt-4 sm:border-s sm:border-t-0 sm:ps-5 sm:pt-0">
            <p className="text-[15px] font-semibold text-zinc-950">{t("Delete my data")}</p>
            <p className="mb-3 mt-0.5 text-[13.5px] text-zinc-600">{t("Start again with nothing shared.")}</p>
            <DeleteData lang={lang} />
          </div>
        </div>
      </section>
    </Shell>
  );
}
