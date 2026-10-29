import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/dictionaries";
import { LinkButton, Page } from "@/components/ui/atoms";

/** Rendered with HTTP 403 when a signed-in person opens the wrong workspace. */
export default async function ForbiddenPage() {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const t = getTranslator(locale);
  return (
    <Page>
      <p className="label-caps">{t("account.demoMode")}</p>
      <h1 className="mt-2 text-ink-900">{t("forbidden.title")}</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-600">{t("forbidden.body")}</p>
      <div className="mt-6">
        <LinkButton href={`/${locale}`}>{t("forbidden.home")}</LinkButton>
      </div>
    </Page>
  );
}
