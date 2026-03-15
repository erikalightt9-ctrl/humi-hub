import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getPlatformSettings, getBrandingSettings } from "@/lib/repositories/settings.repository";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [platform, branding] = await Promise.all([
      getPlatformSettings(),
      getBrandingSettings(),
    ]);

    const icons: Metadata["icons"] = branding.faviconUrl
      ? { icon: branding.faviconUrl }
      : undefined;

    return {
      title: {
        default: `${platform.siteName} — Professional Training Programs`,
        template: `%s | ${platform.siteName}`,
      },
      description: `${platform.siteName} offers world-class professional training programs across multiple industries and career paths.`,
      metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
      openGraph: { siteName: platform.siteName, type: "website" },
      icons,
    };
  } catch {
    return {
      title: {
        default: "HUMI Training Center — Professional Training Programs",
        template: "%s | HUMI Training Center",
      },
      description: "Professional training programs across multiple industries.",
      metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let primaryColor = "#1d4ed8";
  let secondaryColor = "#7c3aed";
  let language = "en";

  try {
    const [platform, branding] = await Promise.all([
      getPlatformSettings(),
      getBrandingSettings(),
    ]);
    primaryColor = branding.primaryColor;
    secondaryColor = branding.secondaryColor;
    language = platform.language;
  } catch {
    /* fall back to defaults on DB unavailability */
  }

  const cssVars = `:root{--brand-primary:${primaryColor};--brand-secondary:${secondaryColor};}`;

  return (
    <html lang={language}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
