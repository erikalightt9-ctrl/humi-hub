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
    const scheduleId = searchParams.get("scheduleId");

    const records = await prisma.sessionAttendance.findMany({
      where: {
        ...(scheduleId ? { scheduleId } : {}),
        ...(from || to
          ? {
              sessionDate: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: {
        schedule: {
          select: {
            name: true,
            course: { select: { title: true } },
            trainer: { select: { name: true } },
          },
        },
        student: {
          select: { name: true, email: true },
        },
      },
      orderBy: [{ sessionDate: "desc" }, { schedule: { name: "asc" } }],
    });

    const headers = [
      "Session Date",
      "Schedule",
      "Course",
      "Trainer",
      "Student Name",
      "Student Email",
      "Present",
      "Notes",
    ];

    const rows = records.map((r) =>
      toCsvRow([
        r.sessionDate.toISOString().split("T")[0],
        r.schedule.name,
        r.schedule.course.title,
        r.schedule.trainer?.name ?? "Unassigned",
        r.student.name,
        r.student.email,
        r.present ? "Yes" : "No",
        r.notes ?? "",
      ])
    );

    const csv = [toCsvRow(headers), ...rows].join("\n");
    const filename = `attendance-report-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/export/attendance]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
