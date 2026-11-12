import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic, Newsreader, Noto_Naskh_Arabic } from "next/font/google";
import { documentLang } from "@/server/lang";
import { dirOf } from "@/lib/i18n";
import "./globals.css";

// Body: Geist (Latin) and IBM Plex Sans Arabic. Display: Newsreader (Latin)
// and Noto Naskh Arabic. Each stack lists the Latin face first; Arabic text
// falls through to the Arabic face because the Latin face has no Arabic glyphs.
const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const plexArabic = IBM_Plex_Sans_Arabic({ variable: "--font-plex-arabic", subsets: ["arabic"], weight: ["400", "500", "600", "700"], display: "swap" });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], style: ["normal", "italic"], display: "swap" });
const naskh = Noto_Naskh_Arabic({ variable: "--font-naskh", subsets: ["arabic"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "Masar · مسار",
  description: "Changes in reproductive health noticed early, explained plainly, and turned into timely choices. Synthetic pilot prototype.",
};

const fonts = [geist, geistMono, plexArabic, newsreader, naskh].map((f) => f.variable).join(" ");

// Every page reads the language cookie for <html lang dir>, so pages render per request.
export const instant = false;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = await documentLang();
  return (
    <html lang={lang} dir={dirOf(lang)} className={fonts}>
      <body>
        <a href="#main" className="skip-link">
          {lang === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content"}
        </a>
        {children}
      </body>
    </html>
  );
}
