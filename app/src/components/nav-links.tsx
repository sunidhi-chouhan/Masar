"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Top navigation with the current page marked. */
export function NavLinks({ items, compact = false }: { items: { href: string; label: string }[]; compact?: boolean }) {
  const path = usePathname();
  return items.map((n) => {
    const active = path === n.href;
    return (
      <Link
        key={n.href}
        href={n.href}
        aria-current={active ? "page" : undefined}
        className={
          compact
            ? `rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 ${active ? "bg-zinc-950 text-white ring-zinc-950" : "bg-white text-zinc-800 ring-zinc-200"}`
            : `rounded-full px-3.5 py-2 text-sm font-medium ${active ? "bg-indigo-50 text-indigo-700" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"}`
        }
      >
        {n.label}
      </Link>
    );
  });
}
