import Link from "next/link";
import type { ReactNode } from "react";
import type { Urgency } from "@/lib/model";
import type { Verdict } from "@/lib/trajectory";
import type { Session } from "@/server/session";
import { setLanguage, signOut } from "@/server/actions";
import { dirOf, t, type Lang } from "@/lib/i18n";
import { getLang } from "@/server/lang";
import { findAccount } from "@/lib/accounts";
import { NavLinks } from "./nav-links";

/** Masar ("path"): one line rising through readings to a gold point. */
export function Mark({ className = "h-8 w-8", inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill={inverted ? "#fff" : "var(--color-indigo-600)"} />
      <path
        d="M7 21.5c3.2 0 4.2-6 7.4-6s3.6 3.6 6.4 3.6S24.5 10 25 10"
        fill="none"
        stroke={inverted ? "var(--color-indigo-600)" : "#fff"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="7" cy="21.5" r="1.7" fill={inverted ? "var(--color-indigo-600)" : "#fff"} />
      <circle cx="25" cy="10" r="2.3" fill="var(--color-amber-500)" />
    </svg>
  );
}

export function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${inverted ? "text-white" : "text-zinc-950"}`}>
      <Mark inverted={inverted} />
      <span className="font-semibold tracking-[-0.025em] text-[1.35rem] leading-none">Masar</span>
      <span className={`text-sm ${inverted ? "text-white/50" : "text-zinc-400"}`}>مسار</span>
    </Link>
  );
}

const PILL = {
  pine: "bg-indigo-50 text-indigo-600 ring-indigo-200/70",
  gold: "bg-amber-50 text-amber-700 ring-amber-500/50",
  clay: "bg-rose-50 text-rose-700 ring-rose-500/30",
  slate: "bg-slate-100 text-slate-600 ring-slate-400/40",
  stone: "bg-zinc-100 text-zinc-800 ring-zinc-300/80",
} as const;

export function Pill({ tone = "stone", children, dot = true }: { tone?: keyof typeof PILL; children: ReactNode; dot?: boolean }) {
  const dotColor = { pine: "bg-indigo-500", gold: "bg-amber-500", clay: "bg-rose-500", slate: "bg-slate-400", stone: "bg-zinc-400" }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${PILL[tone]}`}>
      {dot ? <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dotColor}`} /> : null}
      {children}
    </span>
  );
}

export const URGENCY_PILL: Record<Urgency, { tone: keyof typeof PILL; label: string }> = {
  urgent: { tone: "clay", label: "Before treatment starts" },
  soon: { tone: "gold", label: "Worth discussing soon" },
  routine: { tone: "pine", label: "At your next routine visit" },
};

export const VERDICT_PILL: Record<Verdict, { tone: keyof typeof PILL; label: string }> = {
  meaningful: { tone: "gold", label: "A real change" },
  normal: { tone: "pine", label: "Normal ups and downs" },
  single: { tone: "slate", label: "Only one result so far" },
  too_close: { tone: "slate", label: "Tests too close together to compare" },
};

export function Simulated() {
  return (
    <span className="rounded-full border border-dashed border-slate-400/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
      Synthetic data
    </span>
  );
}

const NAV: Record<Session["role"], { href: string; label: string }[]> = {
  person: [
    { href: "/me", label: "My path" },
    { href: "/me/about", label: "About me" },
    { href: "/me/privacy", label: "My data" },
  ],
  clinician: [{ href: "/clinic", label: "Patients to talk to" }],
  system: [{ href: "/system", label: "How Masar is doing" }],
};

const WHO: Record<Session["role"], string> = {
  person: "Resident",
  clinician: "Family physician",
  system: "Department of Health",
};

function initials(name: string): string {
  return name
    .replace(/^Dr /, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
}

export async function Shell({
  session,
  children,
  wide = false,
  minimal = false,
}: {
  session: Session;
  children: ReactNode;
  wide?: boolean;
  /** hide the navigation, e.g. while someone is still choosing what to share */
  minimal?: boolean;
}) {
  // Residents choose English or Arabic; clinical and health-system screens stay in English.
  const lang: Lang = session.role === "person" ? await getLang() : "en";
  const nav = (minimal ? [] : NAV[session.role]).map((n) => ({ ...n, label: t(lang, n.label) }));
  const account = findAccount(session.role, session.id);
  return (
    <div className="min-h-dvh" dir={dirOf(lang)} lang={lang}>
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur-xl">
        <div className={`mx-auto flex h-16 items-center gap-6 px-4 md:px-8 ${wide ? "max-w-7xl" : "max-w-5xl"}`}>
          <Brand />
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            <NavLinks items={nav} />
          </nav>
          <div className="ms-auto flex items-center gap-3">
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-[12px] font-semibold text-indigo-700">
              {initials(account?.name ?? "")}
            </span>
            <span className="hidden leading-tight md:block">
              <span className="block text-[13px] font-medium text-zinc-900">{account?.name}</span>
              <span className="block text-[12px] text-zinc-500">{t(lang, WHO[session.role])}</span>
            </span>
            {session.role === "person" ? (
              <form action={setLanguage.bind(null, lang === "ar" ? "en" : "ar")}>
                <button
                  lang={lang === "ar" ? "en" : "ar"}
                  aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
                  className="whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  {lang === "ar" ? "English" : "العربية"}
                </button>
              </form>
            ) : null}
            <form action={signOut}>
              <button className="whitespace-nowrap rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-[13px] font-medium text-zinc-800 hover:border-zinc-400">
                {t(lang, "Sign out")}
              </button>
            </form>
          </div>
        </div>
        {nav.length ? (
          <nav className="flex gap-1 px-4 pb-2 sm:hidden" aria-label="Main">
            <NavLinks items={nav} compact />
          </nav>
        ) : null}
      </header>
      <main className={`mx-auto px-4 pb-24 pt-8 md:px-8 md:pt-12 ${wide ? "max-w-7xl" : "max-w-5xl"}`}>{children}</main>
      <Footer lang={lang} />
    </div>
  );
}

/** Intended use, stated wherever the product is used. */
export function Footer({ lang = "en" }: { lang?: Lang }) {
  return (
    <footer className="border-t border-zinc-200 px-4 py-6 text-center text-[12px] leading-relaxed text-zinc-400">
      {t(
        lang,
        "Masar provides educational information and decision support. It does not diagnose, predict fertility or recommend treatment; clinical decisions stay with qualified professionals. Pilot environment: records shown are synthetic.",
      )}
    </footer>
  );
}

export function SectionTitle({ n, title, body }: { n?: number; title: string; body?: string }) {
  return (
    <div className="mb-5">
      <h2 className="flex items-baseline gap-3 font-semibold tracking-[-0.025em] text-[1.7rem] leading-tight text-zinc-950">
        {n ? <span className="font-sans text-sm font-semibold text-indigo-700">0{n}</span> : null}
        {title}
      </h2>
      {body ? <p className="mt-1.5 max-w-2xl text-[15px] text-zinc-600">{body}</p> : null}
    </div>
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
