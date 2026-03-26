import { NextRequest, NextResponse } from "next/server";
import { getPublicSiteData } from "@/lib/services/tenant-page.service";

/* ------------------------------------------------------------------ */
/*  GET — public site data (no auth)                                  */
/*  Returns { organization, theme, pages } for public rendering       */
/* ------------------------------------------------------------------ */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ success: false, data: null, error: "Invalid slug" }, { status: 400 });
    }

    const siteData = await getPublicSiteData(slug);
    if (!siteData) {
      return NextResponse.json({ success: false, data: null, error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: siteData, error: null });
  } catch (err) {
    console.error("[GET /api/public/site/[slug]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
