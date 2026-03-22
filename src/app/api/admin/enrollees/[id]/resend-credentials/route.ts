/**
 * POST /api/admin/enrollees/[id]/resend-credentials
 *
 * Generates a fresh temporary password for an enrolled student,
 * updates the stored hash, marks mustChangePassword=true, and
 * fires off a credentials email (fire-and-forget).
 *
 * Returns the temporary password in plaintext so the admin can
 * relay it manually if email delivery fails.
 *
 * Admin-only.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth-guards";
import { findEnrolleeById } from "@/lib/repositories/enrollee.repository";
import { generateTemporaryPassword } from "@/lib/services/student-auth.service";
import { sendEnrollmentApproved } from "@/lib/services/notification.service";
import { assertTenantOwns, TenantMismatchError } from "@/lib/tenant-isolation";
import { prisma } from "@/lib/prisma";

function jsonError(msg: string, status: number) {
  return NextResponse.json(
    { success: false, data: null, error: msg },
    { status },
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id: studentId } = await params;

    const enrollee = await findEnrolleeById(studentId);
    if (!enrollee) {
      return jsonError("Enrollee not found", 404);
    }

    assertTenantOwns(enrollee.enrollment.course.tenantId, guard.tenantId);

    // Generate a fresh temporary password
    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Update student: new hash + force password change on next login
    await prisma.student.update({
      where: { id: studentId },
      data: { passwordHash, mustChangePassword: true },
    });

    // Fire-and-forget: do not fail the request if email delivery fails
    sendEnrollmentApproved({
      name: enrollee.enrollment.fullName,
      email: enrollee.enrollment.email,
      courseTitle: enrollee.enrollment.course.title,
      temporaryPassword: tempPassword,
    }).catch((emailErr: unknown) => {
      console.error(
        "[resend-credentials] credentials email failed",
        emailErr,
      );
    });

    return NextResponse.json({
      success: true,
      data: { temporaryPassword: tempPassword },
      error: null,
    });
  } catch (err) {
    if (err instanceof TenantMismatchError) {
      return jsonError("Forbidden", 403);
    }
    console.error("[POST /api/admin/enrollees/[id]/resend-credentials]", err);
    return jsonError("Internal server error", 500);
  }
}
