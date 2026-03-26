import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicSiteData } from "@/lib/services/tenant-page.service";

interface SiteLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicSiteData(slug);

  if (!data) {
    return { title: "Not Found" };
  }

  const { organization, theme } = data;
  const businessName = organization.siteName ?? organization.name;
  const typedTheme = theme as ThemeRecord | null;

  return {
    title: businessName,
    description: organization.tagline ?? undefined,
    icons: typedTheme?.faviconUrl
      ? { icon: typedTheme.faviconUrl }
      : undefined,
  };
}

type ThemeRecord = {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontHeading?: string;
  fontBody?: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string | null;
};

function buildThemeCssVars(theme: ThemeRecord | null): React.CSSProperties {
  const t = theme ?? {};
  return {
    "--color-primary": t.primaryColor ?? "#3B82F6",
    "--color-secondary": t.secondaryColor ?? "#1E40AF",
    "--color-accent": t.accentColor ?? "#F59E0B",
    "--color-background": t.backgroundColor ?? "#FFFFFF",
    "--color-text": t.textColor ?? "#111827",
    fontFamily: t.fontBody ?? "Inter, sans-serif",
    backgroundColor: t.backgroundColor ?? "#FFFFFF",
    color: t.textColor ?? "#111827",
  } as React.CSSProperties;
}

function buildGoogleFontUrl(theme: ThemeRecord | null): string {
  const fontHeading = theme?.fontHeading ?? "Inter";
  const fontBody = theme?.fontBody ?? "Inter";
  const fonts = [...new Set([fontHeading, fontBody])];
  const families = fonts
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export default async function SiteLayout({ children, params }: SiteLayoutProps) {
  const { slug } = await params;
  const data = await getPublicSiteData(slug);

  if (!data) {
    notFound();
  }

  const { organization, theme, pages } = data;
  const typedTheme = theme as ThemeRecord | null;
  const businessName = organization.siteName ?? organization.name;
  const logoUrl = typedTheme?.logoUrl ?? organization.logoUrl;
  const themeVars = buildThemeCssVars(typedTheme);
  const googleFontUrl = buildGoogleFontUrl(typedTheme);

  const navPages = pages.filter((p) => p.type !== "LANDING");

  return (
    <div style={themeVars} className="min-h-screen flex flex-col">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href={googleFontUrl} rel="stylesheet" />

      <header
        className="w-full border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm"
        style={{ backgroundColor: "var(--color-background, #FFFFFF)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href={`/site/${organization.slug}`} className="flex items-center gap-3">
            {logoUrl && (
              <img
                src={logoUrl}
                alt={`${businessName} logo`}
                className="h-10 w-auto object-contain"
              />
            )}
            <span
              className="text-xl font-bold"
              style={{ color: "var(--color-primary, #3B82F6)" }}
            >
              {businessName}
            </span>
          </a>

          {navPages.length > 0 && (
            <nav aria-label="Site navigation">
              <ul className="flex items-center gap-6 list-none m-0 p-0">
                {navPages.map((page) => (
                  <li key={page.id}>
                    <a
                      href={`/site/${organization.slug}/${page.slug}`}
                      className="text-sm font-medium transition-colors hover:opacity-80"
                      style={{ color: "var(--color-text, #111827)" }}
                    >
                      {page.title}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href={`/site/${organization.slug}/contact`}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--color-primary, #3B82F6)" }}
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer
        className="w-full border-t border-gray-200 py-8 text-center"
        style={{ backgroundColor: "var(--color-background, #FFFFFF)" }}
      >
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} {businessName}.{" "}
          <span className="text-gray-400">Powered by HUMI</span>
        </p>
      </footer>

      {typedTheme?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: typedTheme.customCss }} />
      )}
    </div>
  );
}
