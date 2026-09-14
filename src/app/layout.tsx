import type { Metadata, Viewport } from "next";
import { Anek_Tamil, Poppins } from "next/font/google";
import "./globals.css";

// Poppins ships as static weights, so they have to be listed explicitly.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const TITLE = "அனிருத் கச்சேரி · Anirudh Concert";
const DESCRIPTION = "Press play. Twenty-one Anirudh Ravichander tracks, back to back.";

// Tamil display face for the wordmark; Poppins has no Tamil glyphs.
const anekTamil = Anek_Tamil({
  subsets: ["tamil", "latin"],
  variable: "--font-anek-tamil",
  display: "swap",
});

export const metadata: Metadata = {
  // Set NEXT_PUBLIC_SITE_URL once this is deployed so previews resolve the
  // generated opengraph-image against the right origin.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Anirudh Concert",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#07050a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${anekTamil.variable} h-full`}>
      <head>
        {/* Shaves a round-trip off the very first play. */}
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://is1-ssl.mzstatic.com" />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
