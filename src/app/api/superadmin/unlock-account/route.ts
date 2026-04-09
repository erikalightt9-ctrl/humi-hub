/**
 * POST /api/superadmin/unlock-account
 *
 * Resets failedAttempts to 0 on ALL user tables for the given email.
 * Used by Super Admin to unblock accounts locked after too many failed attempts.
 *
 * Body: { email: string }
 * Returns: { success, data: { unlockedIn: string[] }, error }
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireSuperAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const email = (body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, data: null, error: "email is required." },
        { status: 400 },
      );
    }

    const unlockedIn: string[] = [];

    // Reset student
    const student = await prisma.student.findUnique({ where: { email }, select: { id: true, failedAttempts: true } });
    if (student) {
      await prisma.student.update({ where: { id: student.id }, data: { failedAttempts: 0 } });
      unlockedIn.push(`student (was ${student.failedAttempts})`);
    }

    // Reset trainer
    const trainer = await prisma.trainer.findUnique({ where: { email }, select: { id: true, failedAttempts: true } });
    if (trainer) {
      await prisma.trainer.update({ where: { id: trainer.id }, data: { failedAttempts: 0 } });
      unlockedIn.push(`trainer (was ${trainer.failedAttempts})`);
    }

    // Reset humi admin
    const humiAdmin = await prisma.humiAdmin.findUnique({ where: { email }, select: { id: true, failedAttempts: true } });
    if (humiAdmin) {
      await prisma.humiAdmin.update({ where: { id: humiAdmin.id }, data: { failedAttempts: 0 } });
      unlockedIn.push(`humi_admin (was ${humiAdmin.failedAttempts})`);
    }

    // Corporate managers don't have failedAttempts — ensure isActive = true
    const manager = await prisma.corporateManager.findFirst({
      where: { email },
      select: { id: true, isActive: true },
    });
    if (manager && !manager.isActive) {
      await prisma.corporateManager.update({ where: { id: manager.id }, data: { isActive: true } });
      unlockedIn.push("corporate_manager (re-activated)");
    } else if (manager) {
      unlockedIn.push("corporate_manager (already active, no action needed)");
    }

    if (unlockedIn.length === 0) {
      return NextResponse.json(
        { success: false, data: null, error: `No account found for ${email}.` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { email, unlockedIn },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/superadmin/unlock-account]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
