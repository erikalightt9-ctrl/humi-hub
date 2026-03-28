import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { getTicketStats } from "@/lib/repositories/support-ticket.repository";

/**
 * GET /api/admin/tickets/stats
 *
 * Returns KPI counts for the admin ticket dashboard.
 * Response: { open, inProgress, resolved, overdue }
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const stats = await getTicketStats();
    return NextResponse.json({ success: true, data: stats, error: null });
  } catch (err) {
    console.error("[GET /api/admin/tickets/stats]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
