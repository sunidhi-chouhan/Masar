import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/dictionaries";
import { formatDate } from "@/lib/i18n/format";
import { Page } from "@/components/ui/atoms";

/** The refusal authorize() wrote for this actor moments ago, if any. */
async function latestRefusal(actorId: string) {
  const since = new Date(Date.now() - 60_000);
  return prisma.auditEvent.findFirst({
    where: { actorId, type: "BlockedAccess", resource: "one-pager", createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Rendered with a real HTTP 403 when the one-pager's consent check refuses.
 * forbidden.tsx receives no props, so the reason is read back from the
 * access log that authorize() has just written: what the page says is what
 * the record says.
 */
export default async function OnePagerForbidden() {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const t = getTranslator(locale);

  const session = await getSession();
  const logged = session ? await latestRefusal(session.userId) : null;
  const reason = logged?.detail ?? "consent_revoked";

  return (
    <Page>
      <div className="rounded-lg border border-slate-400 bg-slate-200/30 p-8 text-center">
        <p className="label-caps text-slate-600">{t("access.blockedTitle")}</p>
        <h1 className="mt-2 text-ink-900">{t("clinician.deniedTitle")}</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-600">{t("clinician.deniedBody")}</p>
        <p className="mt-2 text-sm text-slate-600">{t(`access.${reason}`)}</p>
        <Link href={`/${locale}/clinician`} className="mt-6 inline-block rounded-pill bg-ink-900 px-4 py-2 text-sm text-dawn-50">
          {t("clinician.backToQueue")}
        </Link>
        <p className="mx-auto mt-6 max-w-md border-t border-slate-400/40 pt-3 text-xs text-slate-600">
          {t("clinician.deniedVerify", { reason })}
          {logged
            ? ` ${t("clinician.deniedLogged", { at: formatDate(logged.createdAt, locale, { hour: "2-digit", minute: "2-digit" }) })}`
            : null}
        </p>
      </div>
    </Page>
  );
}
