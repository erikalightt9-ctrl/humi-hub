import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { getPlatformSettings, upsertPlatformSettings } from "@/lib/repositories/settings.repository";
import { generalSettingsSchema } from "@/lib/validations/settings.schema";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;
    const settings = await getPlatformSettings();
    return NextResponse.json({ success: true, data: settings, error: null });
  } catch (err) {
    console.error("[GET /api/admin/settings/general]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const result = generalSettingsSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Validation failed";
      return NextResponse.json({ success: false, data: null, error: firstError }, { status: 422 });
    }

    const settings = await upsertPlatformSettings(result.data);
    return NextResponse.json({ success: true, data: settings, error: null });
  } catch (err) {
    console.error("[PUT /api/admin/settings/general]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
