import { NextResponse } from "next/server";
import { getPublicSettings } from "@/lib/repositories/settings.repository";
import { resolveTenantFromSubdomain } from "@/lib/tenant";
import type { PublicSettings } from "@/lib/repositories/settings.repository";

/**
 * GET /api/settings
 * Public endpoint — returns only safe, non-sensitive settings
 * (branding + general). Never exposes SMTP credentials or security policies.
 * When a subdomain header is present, returns tenant branding merged over defaults.
 */
export async function GET() {
  try {
    const [settings, tenant] = await Promise.all([
      getPublicSettings(),
      resolveTenantFromSubdomain(),
    ]);

    if (tenant) {
      const tenantSettings: PublicSettings = {
        ...settings,
        siteName: tenant.tenant.siteName ?? settings.siteName,
        primaryColor: tenant.tenant.primaryColor ?? settings.primaryColor,
        secondaryColor: tenant.tenant.secondaryColor ?? settings.secondaryColor,
        logoUrl: tenant.tenant.logoUrl ?? settings.logoUrl,
        faviconUrl: tenant.tenant.faviconUrl ?? settings.faviconUrl,
        bannerImageUrl: tenant.tenant.bannerImageUrl ?? settings.bannerImageUrl,
        bannerTagline: tenant.tenant.tagline ?? settings.bannerTagline,
      };
      return NextResponse.json({ success: true, data: tenantSettings, error: null });
    }

    return NextResponse.json({ success: true, data: settings, error: null });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
