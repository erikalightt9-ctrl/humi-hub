import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import type { PaymentStatus } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  GET /api/admin/revenue/payments                                    */
/*  List payments scoped to the tenant (via enrollment.organizationId)*/
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const status  = searchParams.get("status") as PaymentStatus | null;
    const page    = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit   = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
    const search  = searchParams.get("search")?.trim() ?? "";

    const where = {
      enrollment: {
        organizationId: guard.tenantId,
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: "insensitive" as const } },
                { email:    { contains: search, mode: "insensitive" as const } },
                { course:   { title: { contains: search, mode: "insensitive" as const } } },
              ],
            }
          : {}),
      },
      ...(status ? { status } : {}),
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          enrollment: {
            select: {
              fullName:   true,
              email:      true,
              courseTier: true,
              course:     { select: { title: true, currency: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip:  (page - 1) * limit,
        take:  limit,
      }),
      prisma.payment.count({ where }),
    ]);

    const data = payments.map((p) => ({
      id:              p.id,
      studentName:     p.enrollment.fullName,
      studentEmail:    p.enrollment.email,
      courseTitle:     p.enrollment.course.title,
      courseTier:      p.enrollment.courseTier,
      currency:        p.enrollment.course.currency,
      amount:          Number(p.amount),
      method:          p.method,
      status:          p.status,
      referenceNumber: p.referenceNumber,
      paidAt:          p.paidAt,
      createdAt:       p.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      limit,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/revenue/payments]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/revenue/payments                                   */
/*  Record a manual payment against an enrollment                      */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const { enrollmentId, amount, method, referenceNumber, notes, markAsPaid } = body;

    if (!enrollmentId || typeof amount !== "number" || amount <= 0 || !method) {
      return NextResponse.json(
        { success: false, data: null, error: "enrollmentId, amount, and method are required" },
        { status: 422 },
      );
    }

    // Verify the enrollment belongs to this tenant
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, organizationId: true },
    });

    if (!enrollment || enrollment.organizationId !== guard.tenantId) {
      return NextResponse.json(
        { success: false, data: null, error: "Enrollment not found" },
        { status: 404 },
      );
    }

    const status: PaymentStatus = markAsPaid ? "PAID" : "PENDING_PAYMENT";

    const payment = await prisma.payment.create({
      data: {
        enrollmentId,
        amount,
        method,
        status,
        referenceNumber: referenceNumber ?? null,
        notes:           notes ?? null,
        paidAt:          markAsPaid ? new Date() : null,
      },
    });

    // If marking as paid, update enrollment payment status too
    if (markAsPaid) {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data:  { paymentStatus: "PAID" },
      });
    }

    return NextResponse.json({ success: true, data: payment, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/revenue/payments]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
