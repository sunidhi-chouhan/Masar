import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic, Amiri } from "next/font/google";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import "../globals.css";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import { I18nProvider } from "@/lib/i18n/client";
import { dirFor, isLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/translate";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { isDemoMode } from "@/lib/demo/mode";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  display: "swap",
});
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const arabicSans = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic-sans",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Masar · مسار",
  description: "Longitudinal reproductive-health decision support with explicit uncertainty and server-enforced consent.",
};

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!isLocale(locale)) notFound();
  const session = await getSession();
  const dict = (locale === "ar" ? ar : en) as unknown as Dictionary;

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`${fraunces.variable} ${jakarta.variable} ${arabicSans.variable} ${amiri.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale} dictionary={dict} fallback={en as unknown as Dictionary}>
          <AppShell session={session} hasActiveDemo={false} demoMode={isDemoMode()}>
            {children}
          </AppShell>
        </I18nProvider>
      </body>
    </html>
  );
}
