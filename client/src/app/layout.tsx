import type { Metadata } from "next";
import { ClientAuthShell } from "@/components/providers/ClientAuthShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Driftlands",
  description: "Stake. Survive. Drift. A lightweight 3D survival journey on Solana.",
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
      </head>
      <body>
        <ClientAuthShell>{children}</ClientAuthShell>
      </body>
    </html>
  );
}
