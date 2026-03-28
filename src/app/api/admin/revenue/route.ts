import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  type: z
    .enum([
      "PLATFORM_FEE",
      "TENANT_SUBSCRIPTION",
      "ENROLLMENT_PAYMENT",
      "TRAINER_EARNING",
      "REFUND",
      "MANUAL",
    ])
    .default("MANUAL"),
  amount: z.number().positive(),
  currency: z.string().default("PHP"),
  description: z.string().optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  userId: z.string().optional(),
  userType: z.string().optional(),
});

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 50);
    const skip = (page - 1) * limit;

    // Tenant admin sees only their tenant; superadmin sees all
    const tenantFilter = token.isSuperAdmin
      ? {}
      : { tenantId: token.tenantId as string };

    const where = { status: "active", ...tenantFilter };

    const [records, total] = await Promise.all([
      prisma.revenueRecord.findMany({
        where,
        include: {
          auditLogs: { orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.revenueRecord.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        records,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/revenue]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const result = createSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message },
        { status: 422 }
      );

    const record = await prisma.revenueRecord.create({
      data: {
        ...result.data,
        amount: result.data.amount,
        tenantId: token.isSuperAdmin
          ? (body.tenantId ?? null)
          : ((token.tenantId as string) ?? null),
      },
    });

    // Audit log
    await prisma.revenueAuditLog.create({
      data: {
        recordId: record.id,
        action: "CREATE",
        actorId: token.id as string,
        actorRole: token.isSuperAdmin ? "SUPERADMIN" : "ADMIN",
        after: JSON.parse(JSON.stringify(record)),
      },
    });

    return NextResponse.json(
      { success: true, data: record, error: null },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/revenue]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
