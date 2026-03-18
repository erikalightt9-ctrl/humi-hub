import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(fields: (string | null | undefined)[]): string {
  return fields.map(escapeCsvField).join(",");
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where = {
      ...(from || to
        ? {
            paidAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    };

    const payments = await prisma.payment.findMany({
      where,
      include: {
        enrollment: {
          select: {
            fullName: true,
            email: true,
            course: { select: { title: true, slug: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });

    const headers = [
      "Payment ID",
      "Paid At",
      "Student Name",
      "Student Email",
      "Course",
      "Amount (PHP)",
      "Method",
      "Status",
      "Reference Number",
      "Verified At",
      "Notes",
    ];

    const rows = payments.map((p) =>
      toCsvRow([
        p.id,
        p.paidAt?.toISOString() ?? p.createdAt.toISOString(),
        p.enrollment.fullName,
        p.enrollment.email,
        p.enrollment.course.title,
        p.amount.toString(),
        p.method,
        p.status,
        p.referenceNumber ?? "",
        p.verifiedAt?.toISOString() ?? "",
        p.notes ?? "",
      ])
    );

    const csv = [toCsvRow(headers), ...rows].join("\n");
    const filename = `revenue-report-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/export/revenue]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
