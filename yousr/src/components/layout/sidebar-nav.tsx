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
  const pathKeys = new Set(["trajectory", "livingWell", "actions", "couple"]);
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
            <p className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-400">
              {g.id === "path"
                ? t("nav.groups.path")
                : g.id === "you"
                  ? t("nav.groups.you")
                  : t("nav.groups.workspace")}
            </p>
          ) : null}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={`/${locale}${item.href}`}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={`group relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
                      active
                        ? "bg-mist-100/70 text-mist-700"
                        : "text-ink-600 hover:bg-dawn-100/70 hover:text-ink-900"
                    }`}
                  >
                    {active ? (
                      <span aria-hidden className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-mist-700" />
                    ) : null}
                    <span
                      className={`flex h-5 w-5 items-center justify-center [&_svg]:h-[18px] [&_svg]:w-[18px] ${
                        active ? "text-mist-700" : "text-ink-400 group-hover:text-ink-700"
                      }`}
                    >
                      {NAV_ICONS[item.key] ?? NAV_ICONS.about}
                    </span>
                    <span className="truncate">{t(`nav.${item.key}`)}</span>
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
      className={`flex min-h-10 items-center justify-center gap-2 rounded-full border px-3 text-[13px] font-semibold transition-colors [&_svg]:h-4 [&_svg]:w-4 ${
        active
          ? "border-mist-700 bg-mist-700 text-white"
          : "border-dawn-300 bg-white text-ink-900 hover:border-mist-500 hover:text-mist-700"
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
    <Link href={`/${locale}`} onClick={onNavigate} className="flex items-center gap-2.5 leading-none text-ink-900">
      <MasarMark className="h-8 w-8" />
      <span className="flex flex-col">
        <span className="font-display text-[1.3rem] leading-none tracking-tight">{t("common.appName")}</span>
        <span className="mt-0.5 text-[12px] text-ink-400">{t("common.appNameAr")}</span>
      </span>
    </Link>
  );
}

/** Masar ("path"): a single line rising through three readings. */
export function MasarMark({ className = "", inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill={inverted ? "#ffffff" : "var(--mist-700)"} />
      <path
        d="M7 21.5c3.2 0 4.2-6 7.4-6s3.6 3.6 6.4 3.6S24.5 10 25 10"
        fill="none"
        stroke={inverted ? "var(--mist-700)" : "#ffffff"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="7" cy="21.5" r="1.7" fill={inverted ? "var(--mist-700)" : "#ffffff"} />
      <circle cx="25" cy="10" r="2.3" fill="var(--amber-400)" />
    </svg>
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
      className={`flex h-full flex-col border-e border-dawn-200/80 bg-white ${className}`}
    >
      {children}
    </aside>
  );
}
