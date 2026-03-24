import { NextResponse } from "next/server";
import { getAllTierConfigs } from "@/lib/repositories/trainer-tier.repository";

export async function GET() {
  try {
    const configs = await getAllTierConfigs();
    return NextResponse.json({ success: true, data: configs, error: null });
  } catch (err) {
    console.error("[GET /api/tier-configs]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
