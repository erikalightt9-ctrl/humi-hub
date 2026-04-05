import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireSuperAdmin } from "@/lib/auth-guards";
import {
  getFinancialStats,
  getTenantSubscriptions,
  type FinancialFilter,
} from "@/lib/repositories/superadmin.repository";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  const guard = requireSuperAdmin(token);
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const filter = (searchParams.get("filter") ?? "all") as FinancialFilter;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const validFilters: FinancialFilter[] = ["all", "pending", "approved", "rejected"];
  if (!validFilters.includes(filter)) {
    return NextResponse.json(
      { success: false, data: null, error: "Invalid filter value" },
      { status: 400 }
    );
  }

  const [stats, { subscriptions, total }] = await Promise.all([
    getFinancialStats(),
    getTenantSubscriptions({ filter, page, limit }),
  ]);

  return NextResponse.json({
    success: true,
    data: { stats, subscriptions },
    error: null,
    meta: { total, page, limit },
  });
}
