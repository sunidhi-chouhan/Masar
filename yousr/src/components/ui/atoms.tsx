"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/client";
import type { Confidence, Direction, EvidenceStrength, Tier } from "@/lib/domain/types";

/* ---------- decorative glows (retired: kept as no-op for clean clinical layout) ---------- */
export function GlowField({ variant = "dawn" }: { variant?: "dawn" | "mist" | "amber" | "clinic" }) {
  void variant;
  return null;
}

/* ---------- tier ribbon ---------- */
export function TierRibbon({ tier }: { tier: Tier }) {
  const { t } = useI18n();
  const tone =
    tier === "ClinicianOnly"
      ? "border-mist-500/40 bg-mist-100 text-mist-700"
      : tier === "DecisionSupport"
        ? "border-dawn-300 bg-dawn-100 text-ink-900"
        : "border-dawn-200 bg-dawn-50 text-ink-600";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium ${tone}`}
      title={t(`tiers.hint.${tier}`)}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-pill bg-current" />
      {t(`tiers.${tier}`)}
    </span>
  );
}

/* ---------- evidence chip ---------- */
export function EvidenceChip({ strength, compact = false }: { strength: EvidenceStrength; compact?: boolean }) {
  const { t } = useI18n();
  const dots = strength === "Strong" ? 3 : strength === "Moderate" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-dawn-200 bg-dawn-50 px-2 py-0.5 text-xs font-medium text-ink-600">
      <span aria-hidden className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-pill ${i < dots ? "bg-mist-700" : "bg-dawn-300"}`} />
        ))}
      </span>
      {compact ? t(`strength.${strength}`).split(" ")[0] : t(`strength.${strength}`)}
    </span>
  );
}

/* ---------- direction badge ---------- */
const DIRECTION_TONE: Record<Direction, string> = {
  Improving: "bg-mist-100 text-mist-700 border-mist-300",
  Stable: "bg-dawn-100 text-ink-900 border-dawn-300",
  Shifting: "bg-peach-200/70 text-peach-700 border-peach-300",
  Discuss: "bg-amber-100 text-amber-700 border-amber-400/70",
  Unknown: "bg-slate-200/70 text-slate-600 border-slate-400/60",
};
export const DIRECTION_GLYPH: Record<Direction, string> = {
  Improving: "↗",
  Stable: "→",
  Shifting: "↘",
  Discuss: "◆",
  Unknown: "◌",
};

/** `compact` drops the "what this is based on" suffix; detail views keep it. */
export function DirectionBadge({ direction, confidence, compact = false }: { direction: Direction; confidence?: Confidence; compact?: boolean }) {
  const { t } = useI18n();
  if (confidence === "InsufficientData") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-400 bg-slate-200/50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
        <span aria-hidden>{DIRECTION_GLYPH.Unknown}</span>
        <span>{t("confidence.notEnough")}</span>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-medium ${DIRECTION_TONE[direction]}`}>
      <span aria-hidden className="rtl:-scale-x-100">{DIRECTION_GLYPH[direction]}</span>
      <span>{t(`directions.${direction}`)}</span>
      {confidence && !compact ? <span className="opacity-75">· {t(`confidence.${confidence}`)}</span> : null}
    </span>
  );
}

/* ---------- buttons ---------- */
type ButtonTone = "primary" | "secondary" | "ghost" | "amber";
const TONE: Record<ButtonTone, string> = {
  primary: "bg-mist-700 text-white hover:bg-mist-500 disabled:bg-mist-300",
  secondary: "border border-dawn-300 bg-white text-ink-900 hover:bg-dawn-100",
  ghost: "text-mist-700 hover:bg-mist-100",
  amber: "bg-amber-400 text-ink-900 hover:bg-amber-700 hover:text-white",
};

export function Button({
  tone = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-[color,background-color,border-color,transform,box-shadow] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100 ${TONE[tone]} ${className}`}
    />
  );
}

export function LinkButton({
  href,
  tone = "primary",
  className = "",
  children,
}: {
  href: string;
  tone?: ButtonTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-[color,background-color,border-color,transform,box-shadow] duration-150 active:scale-[0.98] ${TONE[tone]} ${className}`}
    >
      {children}
    </Link>
  );
}

/* ---------- section heading ---------- */
export function SectionHeading({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-ink-900">{title}</h2>
        {body ? <p className="mt-1 max-w-2xl text-sm text-ink-600">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ---------- simulated badge ---------- */
export function SimulatedBadge() {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-dashed border-slate-400 bg-slate-200/40 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600">
      {t("common.simulated")}
    </span>
  );
}

/* ---------- page container ---------- */
export function Page({ children, wide = false, className = "" }: { children: ReactNode; wide?: boolean; className?: string }) {
  return (
    <div
      className={`relative mx-auto w-full px-4 py-6 md:px-6 md:py-8 ${wide ? "max-w-7xl" : "max-w-3xl"} ${className}`}
    >
      {children}
    </div>
  );
}
