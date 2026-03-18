import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  findEnrollmentById,
  updateEnrollmentFields,
  deleteEnrollment,
} from "@/lib/repositories/enrollment.repository";
import { generateTemporaryPassword, studentExists } from "@/lib/services/student-auth.service";
import {
  sendEnrollmentApproved,
  sendEnrollmentRejected,
} from "@/lib/services/notification.service";
import { prisma } from "@/lib/prisma";
import { assertTenantOwns, TenantMismatchError } from "@/lib/tenant-isolation";
import type { EnrollmentStatus } from "@prisma/client";

const patchSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "ENROLLED", "PAYMENT_SUBMITTED", "PAYMENT_VERIFIED", "EMAIL_VERIFIED"]),
  rejectionFeedback: z.string().optional(),
});

const editSchema = z.object({
  fullName: z.string().min(2).max(200).optional(),
  email: z.string().email().optional(),
  contactNumber: z.string().min(5).max(30).optional(),
  address: z.string().min(5).optional(),
  courseId: z.string().cuid().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const enrollment = await findEnrollmentById(id);

    if (!enrollment) {
      return NextResponse.json(
        { success: false, data: null, error: "Enrollment not found" },
        { status: 404 }
      );
    }

    assertTenantOwns(enrollment.course.tenantId, guard.tenantId);

    return NextResponse.json({ success: true, data: enrollment, error: null });
  } catch (err) {
    if (err instanceof TenantMismatchError) {
      return NextResponse.json({ success: false, data: null, error: "Forbidden" }, { status: 403 });
    }
    console.error("[GET /api/admin/enrollments/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();

    // If body has editable fields (not status), handle field editing
    if (body.fullName || body.email || body.contactNumber || body.address || body.courseId) {
      const editResult = editSchema.safeParse(body);
      if (!editResult.success) {
        return NextResponse.json(
          { success: false, data: null, error: editResult.error.issues[0]?.message ?? "Invalid input" },
          { status: 422 }
        );
      }

      const existing = await findEnrollmentById(id);
      if (!existing) {
        return NextResponse.json(
          { success: false, data: null, error: "Enrollment not found" },
          { status: 404 }
        );
      }

      assertTenantOwns(existing.course.tenantId, guard.tenantId);

      // Only allow editing non-approved enrollments
      if (existing.status === "ENROLLED") {
        return NextResponse.json(
          { success: false, data: null, error: "Cannot edit an enrolled application" },
          { status: 400 }
        );
      }

      const updated = await updateEnrollmentFields(id, editResult.data);
      return NextResponse.json({ success: true, data: updated, error: null });
    }

    const result = patchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid status value" },
        { status: 422 }
      );
    }

    const existing = await findEnrollmentById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Enrollment not found" },
        { status: 404 }
      );
    }

    assertTenantOwns(existing.course.tenantId, guard.tenantId);

    const courseTitle = existing.course.title;
    const coursePrice = Number(existing.course.price);
    const adminId = token!.id as string;

    // ── APPROVED ──────────────────────────────────────────────────
    // Admin approves → auto-create student account → send login email
    if (result.data.status === "APPROVED") {
      const isFree = coursePrice <= 0;

      // Check idempotency — skip if student already exists
      const alreadyExists = await studentExists(id);
      if (alreadyExists) {
        await prisma.enrollment.update({
          where: { id },
          data: {
            status: "ENROLLED" as EnrollmentStatus,
            statusUpdatedAt: new Date(),
            statusUpdatedBy: adminId,
          },
        });
        const updated = await findEnrollmentById(id);
        return NextResponse.json({ success: true, data: updated, error: null });
      }

      // Generate credentials for the new student
      const tempPassword = generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      const accessExpiry = new Date();
      accessExpiry.setDate(accessExpiry.getDate() + 90);

      // Atomic transaction: update enrollment + create student
      await prisma.$transaction([
        prisma.enrollment.update({
          where: { id },
          data: {
            status: "ENROLLED" as EnrollmentStatus,
            paymentStatus: isFree ? "PAID" : existing.paymentStatus,
            statusUpdatedAt: new Date(),
            statusUpdatedBy: adminId,
          },
        }),
        prisma.student.create({
          data: {
            enrollmentId: id,
            email: existing.email.toLowerCase(),
            name: existing.fullName,
            passwordHash,
            paymentStatus: "PAID",
            amountPaid: isFree ? 0 : coursePrice,
            accessGranted: true,
            accessExpiry,
          },
        }),
      ]);

      // Send login email with credentials (awaited for Vercel serverless)
      await sendEnrollmentApproved({
        name: existing.fullName,
        email: existing.email,
        courseTitle,
        temporaryPassword: tempPassword,
      });

      const updated = await findEnrollmentById(id);
      return NextResponse.json({ success: true, data: updated, error: null });
    }

    // ── REJECTED ──────────────────────────────────────────────────
    if (result.data.status === "REJECTED") {
      const updated = await prisma.enrollment.update({
        where: { id },
        data: {
          status: "REJECTED" as EnrollmentStatus,
          statusUpdatedAt: new Date(),
          statusUpdatedBy: adminId,
        },
      });

      await sendEnrollmentRejected({
        name: existing.fullName,
        email: existing.email,
        courseTitle,
        feedback: result.data.rejectionFeedback,
      });

      return NextResponse.json({ success: true, data: updated, error: null });
    }

    // ── OTHER STATUS CHANGES (PENDING revert, etc.) ──────────────
    const updated = await prisma.enrollment.update({
      where: { id },
      data: {
        status: result.data.status as EnrollmentStatus,
        statusUpdatedAt: new Date(),
        statusUpdatedBy: adminId,
      },
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    if (err instanceof TenantMismatchError) {
      return NextResponse.json({ success: false, data: null, error: "Forbidden" }, { status: 403 });
    }
    console.error("[PATCH /api/admin/enrollments/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Admin: delete an enrollment application                   */
/* ------------------------------------------------------------------ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;

    const existing = await findEnrollmentById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Enrollment not found" },
        { status: 404 }
      );
    }

    assertTenantOwns(existing.course.tenantId, guard.tenantId);

    await deleteEnrollment(id);

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    if (err instanceof TenantMismatchError) {
      return NextResponse.json({ success: false, data: null, error: "Forbidden" }, { status: 403 });
    }
    console.error("[DELETE /api/admin/enrollments/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
