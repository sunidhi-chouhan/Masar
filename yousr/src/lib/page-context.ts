import "server-only";
import { forbidden, notFound, redirect } from "next/navigation";
import { getSession, type Session } from "@/lib/auth/session";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/dictionaries";
import type { Translator } from "@/lib/i18n/translate";
import type { Role } from "@/lib/domain/types";

export interface PageContext {
  locale: Locale;
  session: Session | null;
  t: Translator;
}

export async function pageContext(params: Promise<{ locale: string }>): Promise<PageContext> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const session = await getSession();
  return { locale, session, t: getTranslator(locale) };
}

/** Redirects to the persona picker when nobody is signed in or the role doesn't fit. */
export async function requireRole(
  params: Promise<{ locale: string }>,
  roles: Role[],
): Promise<PageContext & { session: Session }> {
  const ctx = await pageContext(params);
  if (!ctx.session) redirect(`/${ctx.locale}/login`);
  // Signed-in but the wrong workspace: a real 403, not a hidden nav item.
  if (!roles.includes(ctx.session.role)) forbidden();
  return { ...ctx, session: ctx.session };
}
