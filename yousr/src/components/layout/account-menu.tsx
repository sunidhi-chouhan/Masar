"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import type { Session } from "@/lib/auth/session";
import { signInAs, signOut } from "@/server/actions/auth";

const DEMO_PEOPLE: { id: string; nameEn: string; nameAr: string; role: "patient" | "clinician" | "admin"; locale?: "ar" }[] = [
  { id: "u_mariam", nameEn: "Mariam", nameAr: "مريم", role: "patient" },
  { id: "u_fatima", nameEn: "Fatima", nameAr: "فاطمة", role: "patient" },
  { id: "u_omar", nameEn: "Omar", nameAr: "عمر", role: "patient" },
  { id: "u_sara", nameEn: "Sara", nameAr: "سارة", role: "patient", locale: "ar" },
  { id: "u_layla", nameEn: "Dr Layla Al Mansoori", nameAr: "د. ليلى المنصوري", role: "clinician" },
  { id: "u_admin", nameEn: "Health-system view", nameAr: "عرض النظام الصحي", role: "admin" },
];

/**
 * The signed-in person's own menu. The synthetic-person switcher lives in a
 * separate, labelled demo section and exists only while demo mode is on.
 */
export function AccountMenu({ session, demoMode }: { session: Session | null; demoMode: boolean }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!session) {
    return (
      <Link
        href={`/${locale}/login`}
        className="rounded-md border border-dawn-300 bg-white px-3 py-1.5 text-xs font-medium text-ink-900 hover:bg-dawn-100"
      >
        {t("account.signIn")}
      </Link>
    );
  }

  const name = locale === "ar" ? session.nameAr : session.name;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("account.menu")}
        className="flex items-center gap-2 rounded-md border border-dawn-300 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-900 hover:bg-dawn-100"
      >
        <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-pill bg-mist-100 text-[11px] font-semibold text-mist-700">
          {name.trim().charAt(0)}
        </span>
        <span className="max-w-[9rem] truncate">{name}</span>
        <span aria-hidden className="text-[10px] text-ink-400">▾</span>
      </button>

      {open ? (
        <div role="menu" className="surface-paper absolute end-0 z-50 mt-1.5 w-72 p-2 shadow-lg">
          <div className="border-b border-dawn-200 px-2 pb-2 pt-1">
            <p className="text-sm font-semibold text-ink-900">{name}</p>
            <p className="text-xs text-ink-600">{t(`login.roles.${session.role}`)}</p>
          </div>

          {session.role === "patient" ? (
            <ul className="py-1 text-sm">
              {(["profile", "privacy"] as const).map((k) => (
                <li key={k}>
                  <Link
                    role="menuitem"
                    href={`/${locale}/${k}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-2.5 py-1.5 text-ink-900 hover:bg-dawn-100"
                  >
                    {t(`nav.${k}`)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          <button
            type="button"
            role="menuitem"
            disabled={pending}
            onClick={() => start(() => signOut(locale))}
            className="block w-full rounded-md px-2.5 py-1.5 text-start text-sm text-ink-900 hover:bg-dawn-100"
          >
            {t("account.signOut")}
          </button>

          {demoMode ? (
            <div className="mt-2 border-t border-dashed border-slate-400 pt-2">
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="label-caps">{t("account.demoSwitch")}</span>
                <span className="rounded-sm border border-dashed border-slate-400 px-1.5 py-0.5 text-[10px] uppercase text-slate-600">
                  {t("account.demoMode")}
                </span>
              </div>
              <ul className="space-y-0.5">
                {DEMO_PEOPLE.map((p) => {
                  const current = session.userId === p.id;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={pending || current}
                        onClick={() => {
                          setOpen(false);
                          start(() => signInAs(p.id, p.locale ?? locale));
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-start text-xs ${
                          current ? "bg-mist-100/80 text-ink-900" : "text-ink-900 hover:bg-dawn-100"
                        }`}
                      >
                        <span className="truncate">{locale === "ar" ? p.nameAr : p.nameEn}</span>
                        <span className="shrink-0 text-[10px] text-ink-600">{current ? "✓" : t(`login.roles.${p.role}`)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Link
                href={`/${locale}/demo`}
                onClick={() => setOpen(false)}
                className="mt-1.5 block px-2 text-[11px] text-mist-700 underline-offset-4 hover:underline"
              >
                {t("nav.demo")} →
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
