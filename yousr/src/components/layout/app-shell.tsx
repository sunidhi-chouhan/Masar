"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Session } from "@/lib/auth/session";
import { LocaleSwitch } from "@/components/ui/locale-switch";
import { AccountMenu } from "@/components/layout/account-menu";

interface NavItem {
  href: string;
  key: string;
}

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
  const onJourney = pathname.includes("/journey");
  const items = navFor(session?.role);
  const isActive = (href: string) => {
    if (href === "/trajectory" && pathname === `/${locale}`) return true;
    return pathname === `/${locale}${href}` || pathname.startsWith(`/${locale}${href}/`);
  };

  // Journey owns its chrome; avoid competing section nav during onboarding.
  if (onJourney) {
    return <div className="relative flex min-h-dvh flex-col">{children}</div>;
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-dawn-200 bg-dawn-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <Link href={`/${locale}`} className="flex items-baseline gap-1.5 font-display text-lg leading-none text-ink-900">
            <span className="font-semibold">{t("common.appName")}</span>
            <span className="text-ink-400">·</span>
            <span className="text-mist-700">{t("common.appNameAr")}</span>
          </Link>
          <nav aria-label="Primary" className="ms-4 hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  isActive(item.href) ? "bg-dawn-200/80 text-ink-900" : "text-ink-600 hover:bg-dawn-100 hover:text-ink-900"
                }`}
              >
                {t(`nav.${item.key}`)}
              </Link>
            ))}
            {demoMode ? (
              <Link
                href={`/${locale}/journey`}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  isActive("/journey") ? "bg-mist-100 text-mist-700" : "text-mist-700 hover:bg-mist-100/70"
                }`}
                aria-current={isActive("/journey") ? "page" : undefined}
              >
                {hasActiveDemo ? <span aria-hidden className="h-1.5 w-1.5 rounded-pill bg-mist-500" /> : null}
                {t("nav.journey")}
              </Link>
            ) : null}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <LocaleSwitch />
            <AccountMenu session={session} demoMode={demoMode} />
          </div>
        </div>
        <nav aria-label="Primary mobile" className="flex gap-1 overflow-x-auto border-t border-dawn-200/60 px-3 py-1.5 md:hidden">
          {(demoMode ? [...items, { href: "/journey", key: "journey" }] : items).map((item) => (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium ${
                isActive(item.href) ? "bg-dawn-200 text-ink-900" : "text-ink-600"
              }`}
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}
        </nav>
      </header>

      {demoMode ? (
        <p className="border-b border-dashed border-slate-400/60 bg-slate-200/30 px-4 py-1 text-center text-[11px] text-slate-600">
          <span className="font-semibold uppercase tracking-wide">{t("account.demoMode")}</span> · {t("account.demoBanner")}
        </p>
      ) : null}

      <main className="relative flex-1">{children}</main>

      <footer className="border-t border-dawn-200 bg-dawn-100/50 px-4 py-4 text-center text-xs text-ink-600">
        <p className="mx-auto max-w-4xl">{t("footer.disclaimer")}</p>
      </footer>
    </div>
  );
}
