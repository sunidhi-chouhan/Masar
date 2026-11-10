"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-full border border-zinc-300 px-3.5 py-1.5 text-[13px] font-medium text-zinc-800 hover:border-zinc-400"
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
