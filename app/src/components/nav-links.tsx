"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./dashboard/icons";

export type NavIcon = "path" | "user" | "shield" | "users" | "chart" | "book";

/**
 * Navigation with the current page marked. `tabs` is the resident's bottom
 * bar on phones; `compact` the chips under the header on small screens.
 */
export function NavLinks({ items, compact = false, tabs = false }: { items: { href: string; label: string; icon?: NavIcon }[]; compact?: boolean; tabs?: boolean }) {
  const path = usePathname();
  return items.map((n) => {
    const active = path === n.href || (n.href !== "/me" && path.startsWith(`${n.href}/`));
    const className = tabs
      ? `nav-tab flex min-h-[60px] flex-col items-center justify-center gap-1 text-[12px] font-medium ${active ? "text-accent" : "text-ink-3"}`
      : compact
        ? `inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[13.5px] font-medium ring-1 transition-colors ${active ? "bg-ink text-white ring-ink" : "bg-surface text-ink-2 ring-rule hover:ring-rule-strong"}`
        : `relative inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[14px] font-medium transition-colors ${active ? "text-ink" : "text-ink-3 hover:bg-surface hover:text-ink"}`;
    return (
      <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={className}>
        {n.icon ? (
          <span className={tabs ? `grid h-7 w-12 place-items-center rounded-full transition-colors ${active ? "bg-accent-soft" : ""}` : ""}>
            <Icon name={n.icon} className={tabs ? "h-[22px] w-[22px]" : "h-[18px] w-[18px]"} />
          </span>
        ) : null}
        {n.label}
        {!tabs && !compact && active ? <span aria-hidden className="nav-underline absolute inset-x-3.5 -bottom-[11px] h-[2px] rounded-full bg-accent" /> : null}
      </Link>
    );
  });
}
