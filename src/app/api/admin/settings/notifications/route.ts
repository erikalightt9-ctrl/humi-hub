import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getEmailSettings, upsertEmailSettings } from "@/lib/repositories/settings.repository";
import { emailSettingsSchema } from "@/lib/validations/settings.schema";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const settings = await getEmailSettings();
    // Mask the SMTP password — never expose plaintext to the client
    return NextResponse.json({
      success: true,
      data: { ...settings, smtpPassword: settings.smtpPassword ? "••••••••" : "" },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/settings/notifications]", err);
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
    const result = emailSettingsSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Validation failed";
      return NextResponse.json({ success: false, data: null, error: firstError }, { status: 422 });
    }

    // If the client sent the masked placeholder, keep the existing password
    let dataToSave = result.data;
    if (dataToSave.smtpPassword === "••••••••") {
      const existing = await getEmailSettings();
      dataToSave = { ...dataToSave, smtpPassword: existing.smtpPassword };
    }

    const settings = await upsertEmailSettings(dataToSave);
    return NextResponse.json({
      success: true,
      data: { ...settings, smtpPassword: settings.smtpPassword ? "••••••••" : "" },
      error: null,
    });
  } catch (err) {
    console.error("[PUT /api/admin/settings/notifications]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
