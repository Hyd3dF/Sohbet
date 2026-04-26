import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sohbet — Arkadaşlarla buluş",
  description: "Arkadaşlarınızla sohbet edin, anılarınızı paylaşın.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`dark ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
