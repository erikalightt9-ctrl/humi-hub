import { NextResponse } from "next/server";
import { getPublicSettings } from "@/lib/repositories/settings.repository";

/**
 * GET /api/settings
 * Public endpoint — returns only safe, non-sensitive settings
 * (branding + general). Never exposes SMTP credentials or security policies.
 */
export async function GET() {
  try {
    const settings = await getPublicSettings();
    return NextResponse.json({ success: true, data: settings, error: null });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
