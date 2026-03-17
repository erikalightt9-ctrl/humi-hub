import { NextRequest, NextResponse } from "next/server";
import { getTenantBySubdomain } from "@/lib/tenant";

/**
 * GET /api/tenant-branding?subdomain=acme
 * Public endpoint — returns branding for a specific subdomain.
 * No authentication required.
 */
export async function GET(request: NextRequest) {
  try {
    const subdomain = request.nextUrl.searchParams.get("subdomain");

    if (!subdomain) {
      return NextResponse.json(
        { success: false, data: null, error: "subdomain is required" },
        { status: 422 },
      );
    }

    const tenant = await getTenantBySubdomain(subdomain);

    if (!tenant) {
      return NextResponse.json(
        { success: false, data: null, error: "Tenant not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        siteName: tenant.siteName,
        tagline: tenant.tagline,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        logoUrl: tenant.logoUrl,
        faviconUrl: tenant.faviconUrl,
        bannerImageUrl: tenant.bannerImageUrl,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/tenant-branding]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
