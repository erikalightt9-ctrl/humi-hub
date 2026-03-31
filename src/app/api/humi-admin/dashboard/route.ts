import { NextRequest, NextResponse } from "next/server";
import { requireHumiAdmin } from "@/lib/guards/humi-admin-permission";
import { getPlatformStatsForHumiAdmin } from "@/lib/repositories/humi-admin.repository";

export async function GET(request: NextRequest) {
  const guard = await requireHumiAdmin(request);
  if (!guard.authorized) return guard.response;

  try {
    const stats = await getPlatformStatsForHumiAdmin();
    return NextResponse.json({ success: true, data: stats, error: null });
  } catch (err) {
    console.error("[humi-admin][dashboard]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to load stats" }, { status: 500 });
  }
}
