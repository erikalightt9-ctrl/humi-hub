import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getBrandingSettings, upsertBrandingSettings } from "@/lib/repositories/settings.repository";
import { brandingSettingsSchema } from "@/lib/validations/settings.schema";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const settings = await getBrandingSettings();
    return NextResponse.json({ success: true, data: settings, error: null });
  } catch (err) {
    console.error("[GET /api/admin/settings/appearance]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = brandingSettingsSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Validation failed";
      return NextResponse.json({ success: false, data: null, error: firstError }, { status: 422 });
    }

    const settings = await upsertBrandingSettings(result.data);
    return NextResponse.json({ success: true, data: settings, error: null });
  } catch (err) {
    console.error("[PUT /api/admin/settings/appearance]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
