import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kova — Trust Layer for the Agent Economy | Solana Escrow Protocol",
  description:
    "Solana-native escrow for x402 payments. Funds release only after service delivery is cryptographically proven.",
};

export const viewport: Viewport = {
  themeColor: "#080a0f",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
