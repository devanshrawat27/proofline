import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Proofline",
  title: {
    default: "Proofline — Every delivery. Every discrepancy. Proven.",
    template: "%s · Proofline",
  },
  description:
    "Compare purchase orders, receiving records, and supplier invoices. Turn mismatches into evidence-backed cases your team can resolve.",
  keywords: [
    "supplier delivery",
    "receiving discrepancies",
    "purchase order matching",
    "invoice reconciliation",
    "dispute resolution",
    "Proofline",
  ],
  openGraph: {
    type: "website",
    siteName: "Proofline",
    title: "Proofline — Every delivery. Every discrepancy. Proven.",
    description:
      "Compare what was ordered, what arrived, and what was billed. Turn mismatches into evidence-backed cases.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Proofline — Every delivery. Every discrepancy. Proven.",
    description:
      "Compare what was ordered, what arrived, and what was billed. Turn mismatches into evidence-backed cases.",
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png" }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#176B52",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
