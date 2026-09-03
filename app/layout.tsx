import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Autonomous Procurement & Supply Chain Negotiator",
  description:
    "Real-time supply chain risk dashboard with WebMCP-powered agent orchestration and human-in-the-loop PO approval.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
