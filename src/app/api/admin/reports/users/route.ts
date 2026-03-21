import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports/users
 * User breakdown by status, payment, and access.
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const [
      totalStudents,
      activeStudents,
      inactiveStudents,
      paidStudents,
      unpaidStudents,
      totalTrainers,
      activeTrainers,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { accessGranted: true } }),
      prisma.student.count({ where: { accessGranted: false } }),
      prisma.student.count({ where: { paymentStatus: "PAID" } }),
      prisma.student.count({ where: { paymentStatus: "UNPAID" } }),
      prisma.trainer.count(),
      prisma.trainer.count({ where: { isActive: true, accessGranted: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        students: {
          total: totalStudents,
          active: activeStudents,
          inactive: inactiveStudents,
          paid: paidStudents,
          unpaid: unpaidStudents,
        },
        trainers: {
          total: totalTrainers,
          active: activeTrainers,
          inactive: totalTrainers - activeTrainers,
        },
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/reports/users]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
