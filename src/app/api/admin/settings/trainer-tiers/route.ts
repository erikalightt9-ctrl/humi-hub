import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAllTierConfigs } from "@/lib/repositories/trainer-tier.repository";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const configs = await getAllTierConfigs();
    return NextResponse.json({ success: true, data: configs, error: null });
  } catch (err) {
    console.error("[GET /api/admin/settings/trainer-tiers]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
