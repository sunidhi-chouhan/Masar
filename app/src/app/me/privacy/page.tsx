import { redirect } from "next/navigation";
import { DeleteData } from "@/components/delete-data";
import { Shell } from "@/components/ui";
import { FormSwitch } from "@/components/dashboard/form-switch";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { AuditLog, type AuditEntry } from "@/components/dashboard/audit-log";
import { SOURCES } from "@/lib/model";
import { PERMISSION_TEXT, type ConsentKey } from "@/lib/permissions";
import { setAssistantConsent, setReportReadingConsent, setScanning, setSharing, setSource } from "@/server/actions";
import { requireRole } from "@/server/session";
import { accessLog, type AccessEntry } from "@/server/store";
import { personView } from "@/server/views";
import { translator } from "@/server/lang";
import { aiMode } from "@/server/ai/gemini";
import { formatDateIn } from "@/lib/i18n";

// My data: what Masar may use, who can see it, whether Gemini is involved,
// since when, and every look. Each switch is the existing consent action, so
// enforcement and logging are unchanged; this page only explains and groups.

export const instant = false;

/** The log lines that switch each permission on and off, to say since when. */
const LOG_ON: Record<ConsentKey | "scan", string[]> = {
  self: ["Shared: What you tell us"],
  malaffi: ["Shared: Clinic records (Malaffi)"],
  lab: ["Shared: Lab results"],
  healthAge: ["Shared: Health Age check"],
  device: ["Shared: Phone and wearable"],
  share: ["Allowed your doctor to see your summary"],
  assistant: ["Allowed Masar's assistant to read your summary"],
  reading: ["Allowed Masar's assistant to read your uploaded reports"],
  scan: ["Asked Masar to keep an eye out"],
};
const LOG_OFF: Record<ConsentKey | "scan", string[]> = {
  self: ["Stopped sharing: What you tell us"],
  malaffi: ["Stopped sharing: Clinic records (Malaffi)"],
  lab: ["Stopped sharing: Lab results"],
  healthAge: ["Stopped sharing: Health Age check"],
  device: ["Stopped sharing: Phone and wearable"],
  share: ["Stopped your doctor seeing your summary", "Kept your summary private from your doctor"],
  assistant: ["Stopped Masar's assistant reading your summary", "Kept your summary from Masar's assistant"],
  reading: ["Stopped Masar's assistant reading your uploaded reports", "Kept your uploaded reports from Masar's assistant"],
  scan: ["Asked Masar to stop keeping an eye out"],
};

function since(log: AccessEntry[], key: ConsentKey | "scan", on: boolean): string | null {
  const lines = on ? LOG_ON[key] : LOG_OFF[key];
  // Older consent logs listed several sources in one line ("Agreed to share: …").
  const label = SOURCES.find((s) => s.id === key)?.label;
  const hit = log.find((a) => a.who === "You" && (lines.includes(a.what) || (on && label && a.what.startsWith("Agreed to share:") && a.what.includes(label))));
  return hit?.at ?? null;
}

const GROUPS: { id: string; title: string; icon: IconName; keys: ConsentKey[] }[] = [
  { id: "personal", title: "Personal information", icon: "chat", keys: ["self", "device"] },
  { id: "clinical", title: "Clinical records", icon: "flask", keys: ["malaffi", "lab", "healthAge"] },
  { id: "ai", title: "AI assistance (Google Gemini)", icon: "spark", keys: ["assistant", "reading"] },
  { id: "sharing", title: "Sharing with your clinician", icon: "shield", keys: ["share"] },
];

export default async function MyData() {
  const session = await requireRole("person");
  const v = personView(session.id);
  if (!v.state.onboarded) redirect("/me");
  const log = accessLog(session.id);
  const { t, lang } = await translator();
  const s = v.state;
  const mode = aiMode();
  const date = (iso: string) => formatDateIn(lang, iso, { day: "numeric", month: "short", year: "numeric" });

  const isOn = (k: ConsentKey) => (k === "share" ? s.shareWithClinician : k === "assistant" ? s.assistantConsent : k === "reading" ? s.reportReadingConsent : s.sources[k]);
  const action = (k: ConsentKey) =>
    k === "share"
      ? setSharing.bind(null, !s.shareWithClinician)
      : k === "assistant"
        ? setAssistantConsent.bind(null, !s.assistantConsent)
        : k === "reading"
          ? setReportReadingConsent.bind(null, !s.reportReadingConsent)
          : setSource.bind(null, k, !s.sources[k]);
  const statusOf = (k: ConsentKey | "scan", on: boolean) => (on ? "granted" : since(log, k, false) ? "revoked" : "none");
  const STATUS = { granted: t("Permission granted"), revoked: t("Permission withdrawn"), none: t("Never switched on") };

  const gemini = !s.assistantConsent && !s.reportReadingConsent ? "off" : mode === "live" ? "live" : mode === "mock" ? "mock" : "notConnected";
  const shared = SOURCES.filter((x) => s.sources[x.id]).length;

  const entries: AuditEntry[] = log.map((a) => ({
    at: a.at,
    day: formatDateIn(lang, a.at, { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    time: formatDateIn(lang, a.at, { hour: "2-digit", minute: "2-digit" }),
    who: t(a.who),
    what: t(a.what),
    allowed: a.allowed,
    group: a.who === "You" ? "you" : /Dr Layla/.test(a.who) ? "doctor" : /assistant|Gemini/i.test(a.who) ? "assistant" : "masar",
  }));

  return (
    <Shell session={session} wide>
      <header className="dash-card dash-hero">
        <p className="eyebrow">{t("My data")}</p>
        <h1 className="display mt-2 text-[clamp(1.8rem,3.4vw,2.5rem)] leading-tight text-ink">{t("You decide what Masar uses, and who sees it.")}</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink-2">{t("Changes take effect immediately on the server, and every change and every look is written below.")}</p>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "plug" as IconName, k: t("Sources connected"), v: t("{n} of 5", { n: shared }), ok: shared > 0 },
            {
              icon: "spark" as IconName,
              k: t("Gemini processing"),
              v: gemini === "off" ? t("Off") : gemini === "live" ? t("On") : gemini === "mock" ? t("On (demo mock, no live call)") : t("Allowed, not connected"),
              ok: gemini !== "off",
            },
            { icon: "shield" as IconName, k: t("Your doctor"), v: s.shareWithClinician ? t("Can see your summary") : t("Can't see your summary"), ok: s.shareWithClinician },
            { icon: "compass" as IconName, k: t("Keep an eye out"), v: s.scanning ? t("On") : t("Paused"), ok: s.scanning },
          ].map((x) => (
            <div key={x.k} className="rounded-[16px] border border-rule bg-surface/80 px-4 py-3">
              <dt className="flex items-center gap-2 text-[12.5px] text-ink-3">
                <Icon name={x.icon} className="h-4 w-4" />
                {x.k}
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-[15px] font-semibold text-ink">
                <span aria-hidden className={`h-2 w-2 rounded-full ${x.ok ? "bg-accent" : "border border-dashed border-unknown"}`} />
                {x.v}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <section aria-labelledby="perms-title" className="mt-10">
        <h2 id="perms-title" className="display text-[1.7rem] text-ink">
          {t("Your permissions")}
        </h2>
        <p className="mt-1 text-[14.5px] text-ink-2">{t("Each one separately. Switching one off removes its facts from your path and from anything your doctor sees.")}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {GROUPS.map((g) => (
            <section key={g.id} aria-labelledby={`g-${g.id}`} className="dash-card">
              <h3 id={`g-${g.id}`} className="flex items-center gap-2 text-[16px] font-semibold text-ink">
                <span aria-hidden className="grid h-8 w-8 place-items-center rounded-[10px] bg-accent-soft text-accent">
                  <Icon name={g.icon} className="h-4 w-4" />
                </span>
                {t(g.title)}
              </h3>
              <ul className="mt-2 divide-y divide-rule">
                {g.keys.map((k) => {
                  const on = isOn(k);
                  const c = PERMISSION_TEXT[k];
                  const status = statusOf(k, on);
                  const when = since(log, k, on);
                  return (
                    <li key={k} className="py-3">
                      <form action={action(k)} className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold text-ink">{t(c.label)}</p>
                          <p className="mt-0.5 text-[13.5px] text-ink-2">
                            <span className="font-medium text-ink-3">{t("Allows")}: </span>
                            {t(c.does)}
                          </p>
                          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
                            <span className={`jr-status jr-status--${status === "revoked" ? "revoked" : status}`}>{STATUS[status]}</span>
                            {when ? <span className="text-ink-3">{on ? t("since {date}", { date: date(when) }) : t("on {date}", { date: date(when) })}</span> : null}
                          </p>
                        </div>
                        <FormSwitch on={on} label={t(c.label)} />
                      </form>
                      <details className="dash-more mt-1">
                        <summary>{t("What this means")}</summary>
                        <dl className="mt-2 grid gap-3 rounded-[14px] bg-zinc-50 p-3.5 text-[13.5px] sm:grid-cols-2">
                          {[
                            ["What it involves", c.involves],
                            ["Why Masar may use it", c.why],
                            ["What it will never do", c.never],
                            ["Who sees or processes it", c.who],
                          ].map(([kk, vv]) => (
                            <div key={kk}>
                              <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">{t(kk)}</dt>
                              <dd className="mt-0.5 text-ink-2">{t(vv)}</dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    </li>
                  );
                })}
              </ul>
              {g.id === "ai" ? (
                <p className="mt-2 text-[12.5px] text-ink-3">
                  {mode === "mock"
                    ? t("In this demo, Gemini runs as a labelled mock: no live model call is made.")
                    : mode === "off"
                      ? t("Gemini isn't connected in this environment, so Masar writes these itself.")
                      : t("Powered by Google Gemini for personalized follow-up questions and concise health-context summaries. It never diagnoses or predicts.")}
                </p>
              ) : null}
            </section>
          ))}

          <section aria-labelledby="g-scan" className="dash-card">
            <h3 id="g-scan" className="flex items-center gap-2 text-[16px] font-semibold text-ink">
              <span aria-hidden className="grid h-8 w-8 place-items-center rounded-[10px] bg-accent-soft text-accent">
                <Icon name="compass" className="h-4 w-4" />
              </span>
              {t("Keep an eye out for me")}
            </h3>
            <form action={setScanning.bind(null, !s.scanning)} className="mt-3 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] text-ink-2">{t("When your records change, Masar checks whether anything is worth a conversation")}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
                  <span className={`jr-status jr-status--${statusOf("scan", s.scanning)}`}>{STATUS[statusOf("scan", s.scanning)]}</span>
                </p>
              </div>
              <FormSwitch on={s.scanning} label={t("Keep an eye out for me")} />
            </form>
          </section>
        </div>
      </section>

      {/* Who can see what */}
      <section aria-labelledby="who-title" className="mt-10">
        <h2 id="who-title" className="display text-[1.7rem] text-ink">
          {t("Who can access your information")}
        </h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            { who: t("You"), what: t("Everything you shared, and this log."), on: true },
            { who: t("Dr Layla Al Hashimi (family physician)"), what: s.shareWithClinician ? t("Your summary and your requests, from the sources you switched on.") : t("Nothing: sharing is off."), on: s.shareWithClinician },
            {
              who: t("Masar's assistant (Google Gemini)"),
              what: s.assistantConsent ? t("Your summary, to explain it and answer your questions. Never decides a finding.") : t("Nothing: the assistant is off."),
              on: s.assistantConsent,
            },
            { who: t("Employers, insurers, marketing"), what: t("Never, by design. No setting exists that would allow it."), on: false },
          ].map((x) => (
            <li key={x.who} className="dash-card !p-4">
              <p className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
                <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${x.on ? "bg-accent" : "bg-urgent"}`} />
                {x.who}
              </p>
              <p className="mt-1 text-[13.5px] text-ink-2">{x.what}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="log-title" className="mt-10">
        <h2 id="log-title" className="display text-[1.7rem] text-ink">
          {t("Access history")}
        </h2>
        <p className="mt-1 text-[14.5px] text-ink-2">{t("Every choice you made, and every time someone looked, allowed or blocked.")}</p>
        <div className="mt-4">
          <AuditLog
            entries={entries}
            labels={{
              all: t("All"),
              you: t("Your choices"),
              doctor: t("Your doctor"),
              assistant: t("Assistant"),
              blocked: t("Blocked"),
              allowed: t("Allowed"),
              blockedOne: t("Blocked"),
              empty: t("Nothing recorded yet."),
              filter: t("Filter the history"),
              more: t("Show more"),
            }}
          />
        </div>
      </section>

      <section aria-labelledby="copy-title" className="mt-10">
        <h2 id="copy-title" className="display text-[1.7rem] text-ink">
          {t("Your copy, or none at all")}
        </h2>
        <p className="mt-1 text-[14.5px] text-ink-2">{t("Under the UAE data protection law you can have a copy of your data, or have it deleted.")}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="dash-card">
            <p className="text-[15px] font-semibold text-ink">{t("Download my data")}</p>
            <p className="mt-0.5 text-[13.5px] text-ink-2">{t("Your choices, answers, what Masar found, your requests and this log, in one file.")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href="/api/me/export" className="btn btn-primary">
                {t("Download")}
              </a>
              <a href="/me/report" className="btn btn-secondary">
                {t("Open your health report")}
              </a>
            </div>
          </div>
          <div className="dash-card">
            <p className="text-[15px] font-semibold text-ink">{t("Delete my data")}</p>
            <p className="mb-3 mt-0.5 text-[13.5px] text-ink-2">{t("Start again with nothing shared.")}</p>
            <DeleteData lang={lang} />
          </div>
        </div>
      </section>
    </Shell>
  );
}
