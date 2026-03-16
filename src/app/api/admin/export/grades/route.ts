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
    const courseId = searchParams.get("courseId");

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        ...(from || to
          ? {
              completedAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
              },
            }
          : {}),
        ...(courseId
          ? { quiz: { courseId } }
          : {}),
      },
      include: {
        student: { select: { name: true, email: true } },
        quiz: {
          select: {
            title: true,
            passingScore: true,
            course: { select: { title: true } },
          },
        },
      },
      orderBy: [{ completedAt: "desc" }],
    });

    const headers = [
      "Completed At",
      "Student Name",
      "Student Email",
      "Course",
      "Quiz",
      "Score",
      "Passing Score",
      "Result",
    ];

    const rows = attempts.map((a) =>
      toCsvRow([
        a.completedAt.toISOString(),
        a.student.name,
        a.student.email,
        a.quiz.course.title,
        a.quiz.title,
        String(a.score),
        String(a.quiz.passingScore),
        a.passed ? "Passed" : "Failed",
      ])
    );

    const csv = [toCsvRow(headers), ...rows].join("\n");
    const filename = `grade-report-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/export/grades]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
