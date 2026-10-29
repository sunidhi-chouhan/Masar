"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { resetDemo } from "@/server/actions/reset";

export function ResetDemoButton() {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <div className="text-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(t("demo.resetConfirm"))) return;
          start(async () => {
            await resetDemo();
            setDone(true);
            router.refresh();
          });
        }}
        className="rounded-pill border border-ink-900/15 px-3 py-1.5 text-xs text-ink-600 hover:bg-dawn-100 disabled:opacity-60"
      >
        {pending ? "…" : t("demo.reset")}
      </button>
      <p className="mt-1 max-w-xs text-xs text-ink-400">{done ? t("demo.resetDone") : t("demo.resetHint")}</p>
    </div>
  );
}
