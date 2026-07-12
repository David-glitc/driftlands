import type { Metadata } from "next";
import { ClientAuthShell } from "@/components/providers/ClientAuthShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Driftlands",
  description: "Stake. Survive. Drift. A lightweight 3D survival journey on Solana.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/logo-192.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Driftlands",
    description: "Fragments of old certainty. Stake. Survive. Drift.",
    images: [{ url: "/logo-512.png", width: 512, height: 512, alt: "Driftlands" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon-32.png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/logo-192.png" />
      </head>
      <body>
        <ClientAuthShell>{children}</ClientAuthShell>
      </body>
    </html>
  );
}
