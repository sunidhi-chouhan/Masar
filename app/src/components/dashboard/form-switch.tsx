"use client";

import { useFormStatus } from "react-dom";

/** A switch that submits its form (a consent action). Announces its state; shows progress without losing its shape. */
export function FormSwitch({ on, label }: { on: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      role="switch"
      aria-checked={on}
      aria-label={label}
      aria-busy={pending}
      disabled={pending}
      className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-progress ${on ? "bg-accent" : "bg-zinc-300"} ${pending ? "opacity-70" : ""}`}
    >
      <span aria-hidden className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[inset-inline-start] duration-200 ${on ? "start-[22px]" : "start-0.5"} ${pending ? "animate-pulse" : ""}`} />
    </button>
  );
}
