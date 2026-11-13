import Link from "next/link";
import type { ReactNode } from "react";
import type { Urgency } from "@/lib/model";
import type { Verdict } from "@/lib/trajectory";
import type { Session } from "@/server/session";
import { setLanguage, signOut } from "@/server/actions";
import { dirOf, t, type Lang } from "@/lib/i18n";
import { getLang } from "@/server/lang";
import { findAccount } from "@/lib/accounts";
import { NavLinks, type NavIcon } from "./nav-links";

/** Masar ("path"): one line rising through readings to a gold point. */
export function Mark({ className = "h-8 w-8", inverted = false, animated = false }: { className?: string; inverted?: boolean; animated?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={`flip-rtl ${animated ? "mark-anim" : ""} ${className}`} aria-hidden>
      <rect width="32" height="32" rx="9" fill={inverted ? "#fff" : "var(--color-accent)"} />
      <path
        d="M7 21.5c3.2 0 4.2-6 7.4-6s3.6 3.6 6.4 3.6S24.5 10 25 10"
        fill="none"
        stroke={inverted ? "var(--color-accent)" : "#fff"}
        strokeWidth="2"
        strokeLinecap="round"
        pathLength={1}
        className="mark-line"
      />
      <circle cx="7" cy="21.5" r="1.7" fill={inverted ? "var(--color-accent)" : "#fff"} className="mark-start" />
      {animated ? <circle cx="25" cy="10" r="4.6" fill="var(--color-date)" className="mark-glow" /> : null}
      <circle cx="25" cy="10" r="2.3" fill="var(--color-date)" className="mark-end" />
    </svg>
  );
}

export function Brand({ inverted = false, animated = false }: { inverted?: boolean; animated?: boolean }) {
  return (
    <Link href="/" className={`flex min-h-[44px] shrink-0 items-center gap-2.5 ${inverted ? "text-white" : "text-ink"}`} aria-label="Masar · مسار">
      <Mark inverted={inverted} animated={animated} />
      <span aria-hidden className="display text-[1.45rem] leading-none">Masar</span>
      <span aria-hidden className={`hidden font-[family-name:var(--font-naskh)] text-[1.05rem] min-[420px]:inline ${inverted ? "text-white/60" : "text-ink-3"}`}>مسار</span>
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

const NAV: Record<Session["role"], { href: string; label: string; icon: NavIcon }[]> = {
  person: [
    { href: "/me", label: "My path", icon: "path" },
    { href: "/me/about", label: "About me", icon: "user" },
    { href: "/me/privacy", label: "My data", icon: "shield" },
  ],
  clinician: [
    { href: "/clinic", label: "Patients to talk to", icon: "users" },
    { href: "/how-masar-decides", label: "How Masar decides", icon: "book" },
  ],
  system: [
    { href: "/system", label: "How Masar is doing", icon: "chart" },
    { href: "/how-masar-decides", label: "How Masar decides", icon: "book" },
  ],
};

const WHO: Record<Session["role"], string> = {
  person: "Resident",
  clinician: "Family physician",
  system: "Department of Health",
};

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
  const width = wide ? "max-w-7xl" : "max-w-5xl";
  const tabs = session.role === "person" && nav.length > 0;
  return (
    // Minimal (the first-visit journey): a full-height column, so the footer sits at the bottom on
    // short steps and simply follows the content on long ones. Never fixed, never overlapping.
    <div className={minimal ? "jr-shell flex min-h-svh flex-col" : "min-h-dvh"} dir={dirOf(lang)} lang={lang}>
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur-md">
        <div className={`mx-auto flex h-16 items-center gap-3 px-4 sm:gap-6 md:px-8 ${width}`}>
          <Brand />
          <nav className="hidden items-center gap-1 md:flex" aria-label={t(lang, "Main")}>
            <NavLinks items={nav} />
          </nav>
          <div className="ms-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden text-end leading-tight lg:block">
              <span className="block text-[13px] font-medium text-ink">{account?.name}</span>
              <span className="block text-[12px] text-ink-3">{t(lang, WHO[session.role])}</span>
            </span>
            {session.role === "person" ? (
              <form action={setLanguage.bind(null, lang === "ar" ? "en" : "ar")}>
                <button
                  lang={lang === "ar" ? "en" : "ar"}
                  aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
                  className="min-h-[44px] whitespace-nowrap rounded-full px-3 text-[14px] font-semibold text-accent hover:bg-accent-soft"
                >
                  {lang === "ar" ? "English" : "العربية"}
                </button>
              </form>
            ) : null}
            <form action={signOut}>
              <button className="min-h-[44px] whitespace-nowrap rounded-full border border-rule-strong px-3.5 text-[13px] font-medium text-ink hover:border-ink-3">
                {t(lang, "Sign out")}
              </button>
            </form>
          </div>
        </div>
        {nav.length && !tabs ? (
          <nav className="flex gap-1.5 overflow-x-auto px-4 pb-2.5 [scrollbar-width:none] md:hidden" aria-label={t(lang, "Main")}>
            <NavLinks items={nav} compact />
          </nav>
        ) : null}
        {tabs ? (
          <nav className="hidden gap-1.5 overflow-x-auto px-4 pb-2.5 [scrollbar-width:none] sm:flex md:hidden" aria-label={t(lang, "Main")}>
            <NavLinks items={nav} compact />
          </nav>
        ) : null}
      </header>
      <main
        id="main"
        tabIndex={-1}
        className={
          minimal
            ? `jr-main mx-auto flex w-full flex-1 flex-col px-4 md:px-8 ${width}`
            : `mx-auto px-4 pt-8 md:px-8 md:pt-12 ${tabs ? "pb-32 sm:pb-24" : "pb-24"} ${width}`
        }
      >
        {children}
      </main>
      {/* Residents have the docked assistant (and on phones, tabs) at the bottom: keep the footer clear of them. */}
      <div className={session.role === "person" && !minimal ? "pb-36 sm:pb-24" : ""}>
        <Footer lang={lang} compact={minimal} />
      </div>
      {tabs ? (
        <nav
          aria-label={t(lang, "Main")}
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
        >
          <NavLinks items={nav} tabs />
        </nav>
      ) : null}
    </div>
  );
}

/** Intended use, stated wherever the product is used. */
export function Footer({ lang = "en", compact = false }: { lang?: Lang; compact?: boolean }) {
  return (
    <footer className={`border-t border-rule px-4 text-center leading-relaxed text-ink-3 ${compact ? "py-3 text-[11.5px]" : "py-8 text-[12.5px]"}`}>
      {t(
        lang,
        "Masar provides educational information and decision support. It does not diagnose, predict fertility or recommend treatment; clinical decisions stay with qualified professionals. Pilot environment: records shown are synthetic.",
      )}
      {compact ? null : (
        <>
          {" "}
          <Link href="/how-masar-decides" className="link whitespace-nowrap font-semibold">
            {t(lang, "How Masar decides")}
          </Link>
        </>
      )}
    </footer>
  );
}

export function SectionTitle({ n, title, body }: { n?: number; title: string; body?: string }) {
  return (
    <div className="mb-5">
      <h2 className="display flex items-baseline gap-3 text-[1.85rem] leading-tight text-ink">
        {n ? <span className="font-mono text-sm text-accent">0{n}</span> : null}
        {title}
      </h2>
      {body ? <p className="mt-2 max-w-2xl text-[15.5px] leading-relaxed text-ink-2">{body}</p> : null}
    </div>
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
