import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Masar · مسار",
  description:
    "Changes in reproductive health noticed early, explained plainly, and turned into timely choices. Synthetic hackathon prototype.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${plexArabic.variable}`}>
      <body>{children}</body>
    </html>
  );
}
