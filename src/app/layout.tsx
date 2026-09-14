import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const display = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "900"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anirudh — non-stop radio",
  description: "Press play. Twenty-one Anirudh Ravichander tracks, back to back.",
};

export const viewport: Viewport = {
  themeColor: "#07050a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} h-full`}>
      <head>
        {/* Shaves a round-trip off the very first play. */}
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://is1-ssl.mzstatic.com" />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
