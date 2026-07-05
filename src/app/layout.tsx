import type { Metadata } from "next";
import { Caveat, Geist, Inter } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Handwritten annotations on marketing pages only.
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NotifEyes — Optometry staffing, on your terms",
  description:
    "A two-sided marketplace connecting optometry practices with optometrists for fill-in shifts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${inter.variable} ${caveat.variable}`}>
      <body className="min-h-screen antialiased">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
