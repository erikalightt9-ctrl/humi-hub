import { NextRequest, NextResponse } from "next/server";
import { requireHumiAdmin } from "@/lib/guards/humi-admin-permission";
import { getHumiAdminProfile, resetHumiAdminPassword } from "@/lib/repositories/humi-admin.repository";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const guard = await requireHumiAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const profile = await getHumiAdminProfile(guard.adminId);
    return NextResponse.json({ success: true, data: profile, error: null });
  } catch (err) {
    console.error("[humi-admin][profile]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to load profile" }, { status: 500 });
  }
}

const changePasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function PATCH(request: NextRequest) {
  const guard = await requireHumiAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const body = await request.json();
    const result = changePasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, data: null, error: result.error.issues[0].message }, { status: 400 });
    }

    await resetHumiAdminPassword(guard.adminId, result.data.newPassword);
    return NextResponse.json({ success: true, data: { message: "Password updated" }, error: null });
  } catch (err) {
    console.error("[humi-admin][profile PATCH]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to update password" }, { status: 500 });
  }
}
