/**
 * POST /api/admin/enrollees/[id]/unlock
 *
 * Admin action: immediately unlock a student account by clearing
 * failedAttempts and lockUntil.
 *
 * Tenant isolation: non-super admins can only unlock students belonging
 * to their own organization.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;

    // Scope lookup to the admin's tenant when not a super admin
    const student = await prisma.student.findFirst({
      where: {
        id,
        ...(guard.tenantId ? { organizationId: guard.tenantId } : {}),
      },
      select: { id: true, email: true, name: true, lockUntil: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, data: null, error: "Student not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.student.update({
      where: { id },
      data: { failedAttempts: 0, lockUntil: null },
      select: { id: true, email: true, name: true, failedAttempts: true, lockUntil: true },
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[POST /api/admin/enrollees/[id]/unlock]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
