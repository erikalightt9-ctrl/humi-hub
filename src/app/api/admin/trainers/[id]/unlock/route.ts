/**
 * POST /api/admin/trainers/[id]/unlock
 *
 * Admin action: immediately unlock a trainer account by clearing
 * failedAttempts and lockUntil.
 *
 * Tenant isolation: non-super admins can only unlock trainers that are
 * assigned to their own organization via TenantTrainer.
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

    // For tenant-scoped admins, verify the trainer belongs to their org
    if (guard.tenantId) {
      const tenantAssignment = await prisma.tenantTrainer.findFirst({
        where: { trainerId: id, tenantId: guard.tenantId },
        select: { id: true },
      });
      if (!tenantAssignment) {
        return NextResponse.json(
          { success: false, data: null, error: "Trainer not found" },
          { status: 404 },
        );
      }
    } else {
      // Super admin — verify trainer exists
      const exists = await prisma.trainer.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!exists) {
        return NextResponse.json(
          { success: false, data: null, error: "Trainer not found" },
          { status: 404 },
        );
      }
    }

    const updated = await prisma.trainer.update({
      where: { id },
      data: { failedAttempts: 0, lockUntil: null },
      select: { id: true, email: true, name: true, failedAttempts: true, lockUntil: true },
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[POST /api/admin/trainers/[id]/unlock]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
