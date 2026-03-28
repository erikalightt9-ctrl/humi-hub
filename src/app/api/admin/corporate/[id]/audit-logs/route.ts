import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const logs = await prisma.auditLog.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ success: true, data: logs, error: null });
  } catch (err) {
    console.error("[GET /api/admin/corporate/:id/audit-logs]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to fetch logs" }, { status: 500 });
  }
}
