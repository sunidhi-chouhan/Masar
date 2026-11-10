"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useI18n } from "@/lib/i18n/client";
import type { Session } from "@/lib/auth/session";
import { LocaleSwitch } from "@/components/ui/locale-switch";
import { AccountMenu } from "@/components/layout/account-menu";
import { useJourneyMotion } from "@/components/journey/journey-loaders";
import {
  JourneyCta,
  MenuIcon,
  SidebarBrand,
  SidebarNavLinks,
  SidebarPanel,
  type NavItem,
} from "./sidebar-nav";

function navFor(role: Session["role"] | undefined): NavItem[] {
  switch (role) {
    case "patient":
      return [
        { href: "/trajectory", key: "trajectory" },
        { href: "/living-well", key: "livingWell" },
        { href: "/actions", key: "actions" },
        { href: "/couple", key: "couple" },
        { href: "/privacy", key: "privacy" },
        { href: "/profile", key: "profile" },
      ];
    case "clinician":
      return [
        { href: "/clinician", key: "clinician" },
        { href: "/about/how-it-works", key: "about" },
      ];
    case "admin":
      return [
        { href: "/population", key: "population" },
        { href: "/about/how-it-works", key: "about" },
      ];
    default:
      return [
        { href: "/trajectory", key: "trajectory" },
        { href: "/living-well", key: "livingWell" },
        { href: "/about/how-it-works", key: "about" },
      ];
  }
}

const SIDEBAR_W = "w-[15.5rem]";

export function AppShell({
  session,
  hasActiveDemo = false,
  demoMode = false,
  children,
}: {
  session: Session | null;
  hasActiveDemo?: boolean;
  demoMode?: boolean;
  children: ReactNode;
}) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const { animate, dur } = useJourneyMotion();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const onJourney = pathname.includes("/journey");
  const onMarketingHome =
    !session && (pathname === `/${locale}` || pathname === `/${locale}/`);
  const items = navFor(session?.role);

  const isActive = (href: string) => {
    if (href === "/trajectory" && pathname === `/${locale}`) return true;
    return pathname === `/${locale}${href}` || pathname.startsWith(`/${locale}${href}/`);
  };

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Journey + marketing landing own their chrome.
  if (onJourney || onMarketingHome) {
    return <div className="relative flex min-h-dvh flex-col">{children}</div>;
  }

  const navBody = (onNavigate?: () => void) => (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNavLinks items={items} isActive={isActive} onNavigate={onNavigate} />
      </div>
      <div className="space-y-3 border-t border-dawn-200/80 p-3">
        {session?.role === "patient" ? (
          <a
            href={`/${locale}/privacy`}
            onClick={onNavigate}
            className="block rounded-xl border border-mist-300/60 bg-mist-100/50 p-3 transition-colors hover:bg-mist-100"
          >
            <span className="flex items-center gap-2 text-[12.5px] font-semibold text-mist-700">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
                <path d="M10 2.5 4 5v4.6c0 3.7 2.6 6.6 6 7.9 3.4-1.3 6-4.2 6-7.9V5l-6-2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="m7.4 10 1.8 1.8 3.5-3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t("nav.privacy")}
            </span>
            <span className="mt-1 block text-[11.5px] leading-snug text-ink-600">{t("footer.disclaimer")}</span>
          </a>
        ) : (
          <p className="px-1 text-[10.5px] leading-snug text-ink-400">{t("footer.disclaimer")}</p>
        )}
        {demoMode ? (
          <JourneyCta
            hasActiveDemo={hasActiveDemo}
            active={isActive("/journey")}
            onNavigate={onNavigate}
          />
        ) : null}
      </div>
    </>
  );

  return (
    <div className="relative flex min-h-dvh">
      {/* Desktop sidebar */}
      <SidebarPanel
        className={`fixed inset-y-0 start-0 z-40 hidden ${SIDEBAR_W} md:flex`}
      >
        <div className="px-5 pb-3 pt-5">
          <SidebarBrand />
        </div>
        {navBody()}
      </SidebarPanel>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen ? (
          <>
            <motion.button
              type="button"
              aria-label={t("nav.closeMenu")}
              className="fixed inset-0 z-50 bg-ink-900/35 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: animate ? dur(0.2) : 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              id="masar-mobile-nav"
              className={`fixed inset-y-0 start-0 z-50 flex ${SIDEBAR_W} md:hidden`}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: animate ? dur(0.28) : 0, ease: [0.16, 1, 0.3, 1] }}
            >
              <SidebarPanel className="w-full shadow-[var(--shadow-lift)]">
                <div className="flex items-center justify-between border-b border-dawn-200/80 px-4 py-3">
                  <SidebarBrand onNavigate={() => setDrawerOpen(false)} />
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-700 hover:bg-dawn-100"
                    aria-label={t("nav.closeMenu")}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <MenuIcon open />
                  </button>
                </div>
                {navBody(() => setDrawerOpen(false))}
              </SidebarPanel>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col md:ms-[15.5rem]">
        <header className="sticky top-0 z-30 border-b border-dawn-200/70 bg-dawn-50/80 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-2 px-3 md:px-8">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-700 hover:bg-dawn-100 md:hidden"
              aria-expanded={drawerOpen}
              aria-controls="masar-mobile-nav"
              aria-label={t("nav.openMenu")}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon open={false} />
            </button>
            <div className="min-w-0 md:hidden">
              <SidebarBrand />
            </div>
            {demoMode ? (
              <p
                className="hidden items-center gap-2 rounded-full border border-dawn-200 bg-white px-3 py-1 text-[11.5px] text-ink-600 shadow-[var(--shadow-soft)] md:inline-flex"
                title={t("account.demoBanner")}
              >
                <span aria-hidden className="dot bg-amber-400" />
                <span className="font-semibold text-ink-900">{t("account.demoMode")}</span>
                <span className="text-ink-400">·</span>
                <span className="max-w-[28rem] truncate">{t("account.demoBanner")}</span>
              </p>
            ) : null}
            <div className="ms-auto flex items-center gap-2">
              <LocaleSwitch />
              <AccountMenu session={session} demoMode={demoMode} />
            </div>
          </div>
        </header>

        <main className="relative flex-1">{children}</main>

        <footer className="border-t border-dawn-200 bg-dawn-100/40 px-4 py-3 text-center text-xs text-ink-500 md:hidden">
          <p>{t("footer.disclaimer")}</p>
        </footer>
      </div>
    </div>
  );
}
