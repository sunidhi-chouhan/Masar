"use client";

/** Opens the browser's print dialog, where "Save as PDF" is one of the destinations. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary">
      {label}
    </button>
  );
}
