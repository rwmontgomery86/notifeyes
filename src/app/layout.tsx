import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
