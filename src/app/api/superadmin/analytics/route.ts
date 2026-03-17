import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireSuperAdmin } from "@/lib/auth-guards";
import { getPlatformAnalytics } from "@/lib/repositories/superadmin.repository";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireSuperAdmin(token);
    if (!guard.ok) return guard.response;

    const analytics = await getPlatformAnalytics();
    return NextResponse.json({ success: true, data: analytics, error: null });
  } catch (err) {
    console.error("[GET /api/superadmin/analytics]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
