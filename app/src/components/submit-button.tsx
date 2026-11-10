"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { DotsLoader } from "./loaders";

/** A form's submit button that shows progress while the server works. */
export function SubmitButton({
  children,
  className = "",
  pendingLabel,
  formAction,
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
  /** a different action for this button than the form's own */
  formAction?: (form: FormData) => void | Promise<void>;
}) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} aria-busy={pending} formAction={formAction} className={`inline-flex items-center justify-center gap-2 transition-opacity disabled:opacity-80 ${className}`}>
      {pending ? (
        <>
          <DotsLoader />
          <span>{pendingLabel ?? "Saving"}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
