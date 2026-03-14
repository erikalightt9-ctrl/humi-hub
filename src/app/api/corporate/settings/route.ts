import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { updateSettingsSchema } from "@/lib/validations/corporate.schema";

/* ------------------------------------------------------------------ */
/*  GET — Get organization settings                                    */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "corporate" || !token.organizationId) {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const orgId = token.organizationId as string;

    const [org, employeeCount] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true, industry: true, maxSeats: true, logoUrl: true },
      }),
      prisma.student.count({ where: { organizationId: orgId } }),
    ]);

    if (!org) {
      return NextResponse.json(
        { success: false, data: null, error: "Organization not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: org.name,
        industry: org.industry,
        maxSeats: org.maxSeats,
        logoUrl: org.logoUrl,
        totalEmployees: employeeCount,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/corporate/settings]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PUT — Update organization settings                                 */
/* ------------------------------------------------------------------ */

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "corporate" || !token.organizationId) {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const orgId = token.organizationId as string;
    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.industry !== undefined) updateData.industry = parsed.data.industry;

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: updateData,
      select: { name: true, industry: true, maxSeats: true, logoUrl: true },
    });

    const employeeCount = await prisma.student.count({
      where: { organizationId: orgId },
    });

    return NextResponse.json({
      success: true,
      data: { ...updated, totalEmployees: employeeCount },
      error: null,
    });
  } catch (err) {
    console.error("[PUT /api/corporate/settings]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
