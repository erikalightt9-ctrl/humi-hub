import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { getAllSubmissions } from "@/lib/repositories/assignment.repository";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;
    const status = request.nextUrl.searchParams.get("status") ?? "PENDING";
    const submissions = await getAllSubmissions({ status, scope: guard.tenantId });
    return NextResponse.json({ success: true, data: submissions, error: null });
  } catch (err) {
    console.error("[GET /api/admin/submissions]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
