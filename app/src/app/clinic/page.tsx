import Link from "next/link";
import { Pill, Shell, URGENCY_PILL, formatDate } from "@/components/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { requireRole } from "@/server/session";
import { clinicianInbox, type InboxRow } from "@/server/views";

// Per-user page: it reads the session on every request, so it is never prerendered.
export const instant = false;

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  requested: "Asked to talk",
  reviewed: "Reviewed, to book",
  booked: "Booked",
  attended: "Done",
};

const STATUS_ICON: Record<string, IconName> = { new: "spark", requested: "chat", reviewed: "check", booked: "calendar", attended: "check" };

const TIMING = ["urgent", "soon", "routine"] as const;

/** Two initials in a soft circle: a quick visual anchor in a long list. */
function Avatar({ name, tone }: { name: string; tone: "urgent" | "soon" | "routine" }) {
  const ring = { urgent: "bg-rose-50 text-rose-700", soon: "bg-amber-50 text-amber-800", routine: "bg-indigo-50 text-indigo-700" }[tone];
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <span aria-hidden className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[14px] font-semibold ${ring}`}>
      {initials}
    </span>
  );
}
const STATUS_FILTERS = [
  ["all", "All"],
  ["requested", "Asked to talk"],
  ["new", "New"],
  ["open", "In progress"],
] as const;

function matches(r: InboxRow, q: string, timing: string, status: string) {
  if (q && !`${r.name} ${r.signalTitles.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
  if (timing !== "all" && r.urgency !== timing) return false;
  if (status === "open") return r.status === "reviewed" || r.status === "booked";
  if (status !== "all" && r.status !== status) return false;
  return true;
}

export default async function Inbox({ searchParams }: PageProps<"/clinic">) {
  const session = await requireRole("clinician");
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = one("q").slice(0, 60);
  const timing = TIMING.includes(one("timing") as (typeof TIMING)[number]) ? one("timing") : "all";
  const status = STATUS_FILTERS.some(([v]) => v === one("status")) ? one("status") : "all";

  const all = clinicianInbox();
  const rows = all.filter((r) => matches(r, q, timing, status));
  const asked = all.filter((r) => r.status === "requested").length;
  const href = (change: Record<string, string>) => {
    const p = new URLSearchParams({ ...(q && { q }), timing, status, ...change });
    for (const [k, v] of [...p]) if (v === "all" || !v) p.delete(k);
    const s = p.toString();
    return s ? `/clinic?${s}` : "/clinic";
  };

  const counts: { label: string; value: number; tone: string; link: string; icon: IconName }[] = [
    { label: "Asked to talk", value: asked, tone: "text-amber-600", link: href({ status: "requested", timing: "all" }), icon: "chat" },
    ...TIMING.map((t) => ({ label: URGENCY_PILL[t].label, value: all.filter((r) => r.urgency === t).length, tone: "text-zinc-950", link: href({ timing: t, status: "all" }), icon: (t === "urgent" ? "flag" : t === "soon" ? "clock" : "calendar") as IconName })),
  ];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <Shell session={session} wide>
      <p className="eyebrow">Patients to talk to · {formatDate(new Date().toISOString())}</p>
      <h1 className="mt-3 font-semibold tracking-[-0.025em] text-[clamp(2.2rem,4vw,3rem)] leading-[1.05] text-zinc-950">{greeting}, Dr Layla.</h1>
      <p className="mt-3 max-w-2xl text-[15px] text-zinc-600">
        {all.length} patients have something worth a conversation{asked ? `, and ${asked === 1 ? "1 has" : `${asked} have`} asked you for one` : ""}. You only see people
        who chose to share with you, and only what they shared. Every decision stays yours.
      </p>

      <dl className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
        {counts.map((c, i) => (
          <Link key={c.label} href={c.link} className="clinic-count card group flex min-h-[88px] flex-col justify-between px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-indigo-300" style={{ ["--i" as string]: i }}>
            <dt className="flex items-start justify-between gap-2 text-[12.5px] leading-snug text-zinc-500">
              {c.label}
              <Icon name={c.icon} className="h-[18px] w-[18px] shrink-0 text-zinc-400 transition-colors group-hover:text-indigo-500" />
            </dt>
            <dd className={`tabular mt-1 text-[1.6rem] font-semibold leading-none ${c.tone}`}>{c.value}</dd>
          </Link>
        ))}
      </dl>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <form action="/clinic" className="relative flex-1">
          <input type="hidden" name="timing" value={timing} />
          <input type="hidden" name="status" value={status} />
          <label className="sr-only" htmlFor="q">
            Search patients
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Search by name or reason"
            type="search"
            className="min-h-[48px] w-full rounded-full border border-zinc-300 bg-white pe-4 ps-11 text-[15px] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
          />
          <Icon name="search" className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
        </form>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map(([v, label]) => (
            <Link
              key={v}
              href={href({ status: v })}
              aria-current={status === v ? "true" : undefined}
              className={`inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-full px-4 text-[13.5px] font-medium transition-colors ${status === v ? "bg-zinc-950 text-white" : "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"}`}
            >
              {label}
            </Link>
          ))}
          {timing !== "all" ? (
            <Link href={href({ timing: "all" })} aria-label={`Remove filter: ${URGENCY_PILL[timing as (typeof TIMING)[number]].label}`} className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-indigo-50 px-4 text-[13.5px] font-medium text-indigo-700">
              {URGENCY_PILL[timing as (typeof TIMING)[number]].label}
              <Icon name="close" className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>

      {rows.length ? (
        <ul className="card mt-4 divide-y divide-zinc-200/70 overflow-hidden">
          <li aria-hidden className="hidden grid-cols-[1.1fr_1.6fr_0.9fr_0.8fr_auto] gap-4 bg-zinc-100/60 px-5 py-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-zinc-500 lg:grid">
            <span className="ps-14">Patient</span>
            <span>Why</span>
            <span>Timing</span>
            <span>Status</span>
            <span className="w-[100px]" />
          </li>
          {rows.map((r, i) => (
            <li key={r.id} className="clinic-row relative grid gap-3 px-4 py-4 hover:bg-zinc-100/40 sm:px-5 lg:grid-cols-[1.1fr_1.6fr_0.9fr_0.8fr_auto] lg:items-center lg:gap-4" style={{ ["--i" as string]: Math.min(i, 12) }}>
              {r.status === "requested" ? <span aria-hidden className="absolute inset-y-3 start-0 w-[3px] rounded-full bg-amber-500" /> : null}
              <div className="flex items-start gap-3">
                <Avatar name={r.name} tone={r.urgency} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-950">
                    {r.name}
                    {r.live ? null : <span className="ms-2 text-[11px] font-normal text-zinc-500">example</span>}
                  </p>
                  <p className="text-[12.5px] text-zinc-500">
                    {r.age} · {r.sex === "female" ? "woman" : "man"} · seen {formatDate(r.touchpoint)}
                  </p>
                  <span className="mt-1.5 block lg:hidden">
                    <Pill tone={URGENCY_PILL[r.urgency].tone}>{URGENCY_PILL[r.urgency].label}</Pill>
                  </span>
                </div>
              </div>
              <div className="flex gap-2 text-[14px] text-zinc-800 lg:block">
                <Icon name="flag" className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 lg:hidden" />
                <div>
                  {r.signalTitles.map((t) => (
                    <p key={t}>{t}</p>
                  ))}
                </div>
              </div>
              <span className="hidden lg:block">
                <Pill tone={URGENCY_PILL[r.urgency].tone}>{URGENCY_PILL[r.urgency].label}</Pill>
              </span>
              <div className="flex items-center justify-between gap-3 lg:contents">
                <span className={`inline-flex items-center gap-1.5 text-[14px] ${r.status === "requested" ? "font-semibold text-amber-700" : "text-zinc-700"}`}>
                  <Icon name={STATUS_ICON[r.status] ?? "spark"} className="h-4 w-4" />
                  {STATUS_LABEL[r.status]}
                </span>
                <Link href={`/clinic/${r.id}`} aria-label={`Review ${r.name}`} className="group inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-5 text-center text-[13.5px] font-semibold text-white hover:bg-indigo-700">
                  Review
                  <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card mt-4 p-8 text-center">
          <p className="text-[15px] font-semibold text-zinc-950">No patients match.</p>
          <Link href="/clinic" className="mt-2 inline-block text-[14px] font-medium text-indigo-600">
            Clear filters
          </Link>
        </div>
      )}
      <p className="mt-4 text-[13.5px] text-zinc-500">
        Patients appear here once they have read what Masar told them and chosen to share it with you. Rows marked “example” fill out the list
        and are read only.
      </p>
    </Shell>
  );
}
