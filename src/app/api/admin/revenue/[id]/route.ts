import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  type: z
    .enum([
      "PLATFORM_FEE",
      "TENANT_SUBSCRIPTION",
      "ENROLLMENT_PAYMENT",
      "TRAINER_EARNING",
      "REFUND",
      "MANUAL",
    ])
    .optional(),
  currency: z.string().optional(),
  reason: z.string().min(1, "Reason required for edits"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    const { id } = await params;
    const record = await prisma.revenueRecord.findUnique({
      where: { id },
      include: { auditLogs: { orderBy: { createdAt: "desc" } } },
    });

    if (!record || record.status === "deleted") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }
    if (!token.isSuperAdmin && record.tenantId !== token.tenantId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: record, error: null });
  } catch (err) {
    console.error("[GET /api/admin/revenue/[id]]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id || (!token.isTenantAdmin && !token.isSuperAdmin)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.revenueRecord.findUnique({ where: { id } });
    if (!existing || existing.status === "deleted") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }
    if (!token.isSuperAdmin && existing.tenantId !== token.tenantId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message },
        { status: 422 }
      );

    const { reason, ...updateData } = result.data;
    const updated = await prisma.revenueRecord.update({
      where: { id },
      data: updateData,
    });

    await prisma.revenueAuditLog.create({
      data: {
        recordId: id,
        action: "UPDATE",
        actorId: token.id as string,
        actorRole: token.isSuperAdmin ? "SUPERADMIN" : "ADMIN",
        before: JSON.parse(JSON.stringify(existing)),
        after: JSON.parse(JSON.stringify(updated)),
        reason,
      },
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PUT /api/admin/revenue/[id]]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id || (!token.isTenantAdmin && !token.isSuperAdmin)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.revenueRecord.findUnique({ where: { id } });
    if (!existing || existing.status === "deleted") {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }
    if (!token.isSuperAdmin && existing.tenantId !== token.tenantId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Soft delete
    const body = await request.json().catch(() => ({}));
    const softDeleted = await prisma.revenueRecord.update({
      where: { id },
      data: {
        status: "deleted",
        deletedAt: new Date(),
        deletedBy: token.id as string,
      },
    });

    await prisma.revenueAuditLog.create({
      data: {
        recordId: id,
        action: "DELETE",
        actorId: token.id as string,
        actorRole: token.isSuperAdmin ? "SUPERADMIN" : "ADMIN",
        before: JSON.parse(JSON.stringify(existing)),
        reason: (body as { reason?: string }).reason ?? "Soft deleted",
      },
    });

    void softDeleted;

    return NextResponse.json({
      success: true,
      data: { deleted: true },
      error: null,
    });
  } catch (err) {
    console.error("[DELETE /api/admin/revenue/[id]]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
