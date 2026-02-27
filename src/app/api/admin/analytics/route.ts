import { NextResponse } from "next/server";
import { getAnalyticsStats } from "@/lib/repositories/admin.repository";

export async function GET() {
  try {
    const stats = await getAnalyticsStats();
    return NextResponse.json({ success: true, data: stats, error: null });
  } catch (err) {
    console.error("[GET /api/admin/analytics]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
