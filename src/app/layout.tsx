import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getPlatformSettings, getBrandingSettings } from "@/lib/repositories/settings.repository";
import { resolveTenantFromSubdomain } from "@/lib/tenant";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  try {
    const tenant = await resolveTenantFromSubdomain();

    // Tenant branding takes precedence over the global singleton
    const siteName =
      tenant?.tenant.siteName ?? (await getPlatformSettings()).siteName;
    const faviconUrl =
      tenant?.tenant.faviconUrl ?? (await getBrandingSettings()).faviconUrl;

    const icons: Metadata["icons"] = faviconUrl ? { icon: faviconUrl } : undefined;

    return {
      title: {
        default: `${siteName} — Professional Training Programs`,
        template: `%s | ${siteName}`,
      },
      description: `${siteName} offers world-class professional training programs across multiple industries and career paths.`,
      metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
      openGraph: { siteName, type: "website" },
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
    const tenant = await resolveTenantFromSubdomain();

    if (tenant) {
      primaryColor = tenant.tenant.primaryColor ?? primaryColor;
      secondaryColor = tenant.tenant.secondaryColor ?? secondaryColor;
    } else {
      const [platform, branding] = await Promise.all([
        getPlatformSettings(),
        getBrandingSettings(),
      ]);
      primaryColor = branding.primaryColor;
      secondaryColor = branding.secondaryColor;
      language = platform.language;
    }
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
