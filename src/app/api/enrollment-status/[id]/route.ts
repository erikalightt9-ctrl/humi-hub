import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        statusUpdatedAt: true,
        emailConfirmedAt: true,
        course: {
          select: { title: true, price: true },
        },
        payments: {
          select: {
            status: true,
            paidAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" as const },
          take: 1,
        },
        student: {
          select: { createdAt: true },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, data: null, error: "Enrollment not found" },
        { status: 404 }
      );
    }

    // Build step timestamps
    const paymentSubmittedAt = enrollment.payments[0]?.createdAt?.toISOString() ?? null;
    const paymentVerifiedAt = enrollment.payments[0]?.paidAt?.toISOString() ?? null;
    const emailVerifiedAt = enrollment.emailConfirmedAt?.toISOString() ?? null;
    const approvedAt =
      enrollment.status === "APPROVED" || enrollment.status === "ENROLLED"
        ? (enrollment.statusUpdatedAt?.toISOString() ?? null)
        : null;
    const activatedAt = enrollment.student?.createdAt?.toISOString() ?? null;

    const data = {
      id: enrollment.id,
      fullName: enrollment.fullName,
      courseTitle: enrollment.course.title,
      coursePrice: enrollment.course.price.toString(),
      status: enrollment.status,
      submittedAt: enrollment.createdAt.toISOString(),
      paymentSubmittedAt,
      paymentVerifiedAt,
      emailVerifiedAt,
      approvedAt,
      activatedAt,
    };

    return NextResponse.json({ success: true, data, error: null });
  } catch (err) {
    console.error("[GET /api/enrollment-status/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
