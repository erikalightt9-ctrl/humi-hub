import { NextResponse } from "next/server";
import { getPublicPlacementStats } from "@/lib/repositories/placement.repository";

/* ------------------------------------------------------------------ */
/*  GET  /api/public/placement-stats                                   */
/*  Public — no auth required                                          */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const stats = await getPublicPlacementStats();
    return NextResponse.json({ success: true, data: stats, error: null });
  } catch (err) {
    console.error("[GET /api/public/placement-stats]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
