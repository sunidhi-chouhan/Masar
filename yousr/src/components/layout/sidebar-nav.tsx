"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/client";
import { NAV_ICONS } from "./nav-icons";

export interface NavItem {
  href: string;
  key: string;
  group?: "path" | "you" | "other";
}

export function groupNavItems(items: NavItem[]): { id: "path" | "you" | "other"; items: NavItem[] }[] {
  const pathKeys = new Set(["trajectory", "insights", "livingWell", "actions", "import", "couple"]);
  const youKeys = new Set(["privacy", "profile"]);
  const path: NavItem[] = [];
  const you: NavItem[] = [];
  const other: NavItem[] = [];
  for (const item of items) {
    if (pathKeys.has(item.key)) path.push({ ...item, group: "path" });
    else if (youKeys.has(item.key)) you.push({ ...item, group: "you" });
    else other.push({ ...item, group: "other" });
  }
  const groups: { id: "path" | "you" | "other"; items: NavItem[] }[] = [];
  if (path.length) groups.push({ id: "path", items: path });
  if (you.length) groups.push({ id: "you", items: you });
  if (other.length) groups.push({ id: "other", items: other });
  return groups;
}

export function SidebarNavLinks({
  items,
  isActive,
  onNavigate,
}: {
  items: NavItem[];
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  const { t, locale } = useI18n();
  const groups = groupNavItems(items);

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.id}>
          {g.id !== "other" || groups.length > 1 ? (
            <p className="label-caps mb-2 px-2.5 text-ink-400">
              {g.id === "path"
                ? t("nav.groups.path")
                : g.id === "you"
                  ? t("nav.groups.you")
                  : t("nav.groups.workspace")}
            </p>
          ) : null}
          <ul className="space-y-1">
            {g.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={`/${locale}${item.href}`}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={`group flex min-h-11 items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-mist-700 text-white shadow-[var(--shadow-soft)]"
                        : "text-ink-600 hover:bg-dawn-100 hover:text-ink-900"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        active ? "bg-white/15 text-white" : "bg-dawn-100 text-mist-700"
                      }`}
                    >
                      {NAV_ICONS[item.key] ?? NAV_ICONS.about}
                    </span>
                    <span className="truncate">{t(`nav.${item.key}`)}</span>
                    {active ? (
                      <span aria-hidden className="ms-auto h-1.5 w-1.5 rounded-pill bg-peach-400" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function JourneyCta({
  hasActiveDemo,
  active,
  onNavigate,
}: {
  hasActiveDemo: boolean;
  active: boolean;
  onNavigate?: () => void;
}) {
  const { t, locale } = useI18n();
  return (
    <Link
      href={`/${locale}/journey`}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${
        active
          ? "bg-mist-500 text-white"
          : "bg-mist-700 text-white hover:bg-mist-500"
      }`}
    >
      {hasActiveDemo ? <span aria-hidden className="h-1.5 w-1.5 rounded-pill bg-peach-300" /> : null}
      {NAV_ICONS.journey}
      {t("nav.journey")}
    </Link>
  );
}

export function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden>
      {open ? (
        <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      ) : (
        <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function SidebarBrand({ onNavigate }: { onNavigate?: () => void }) {
  const { t, locale } = useI18n();
  return (
    <Link
      href={`/${locale}`}
      onClick={onNavigate}
      className="flex items-baseline gap-1.5 font-display text-lg leading-none text-ink-900"
    >
      <span className="font-semibold">{t("common.appName")}</span>
      <span className="text-ink-400">·</span>
      <span className="text-mist-700">{t("common.appNameAr")}</span>
    </Link>
  );
}

export function SidebarPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={`flex h-full flex-col border-e border-dawn-200/80 bg-gradient-to-b from-dawn-50 via-white to-mist-100/30 ${className}`}
    >
      {children}
    </aside>
  );
}
