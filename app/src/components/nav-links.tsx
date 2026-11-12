"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navigation with the current page marked. `tabs` is the resident's bottom
 * bar on phones; `compact` the chips for other roles on phones.
 */
export function NavLinks({ items, compact = false, tabs = false }: { items: { href: string; label: string }[]; compact?: boolean; tabs?: boolean }) {
  const path = usePathname();
  return items.map((n) => {
    const active = path === n.href;
    const className = tabs
      ? `flex min-h-[56px] flex-col items-center justify-center gap-1 text-[12.5px] font-medium ${active ? "text-accent" : "text-ink-3"}`
      : compact
        ? `rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 ${active ? "bg-ink text-white ring-ink" : "bg-surface text-ink-2 ring-rule"}`
        : `relative rounded-full px-3.5 py-2 text-[14px] font-medium ${active ? "text-ink" : "text-ink-3 hover:text-ink"}`;
    return (
      <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={className}>
        {tabs ? <span aria-hidden className={`h-1 w-6 rounded-full ${active ? "bg-accent" : "bg-transparent"}`} /> : null}
        {n.label}
        {!tabs && !compact && active ? <span aria-hidden className="absolute inset-x-3.5 -bottom-[13px] h-[2px] rounded-full bg-accent" /> : null}
      </Link>
    );
  });
}
