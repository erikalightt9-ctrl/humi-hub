import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "VA Training Center — Virtual Assistant Courses",
    template: "%s | VA Training Center",
  },
  description:
    "VA Training Center offers world-class virtual assistant training programs for Medical VA, Real Estate VA, and US Bookkeeping VA careers.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    siteName: "VA Training Center",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
