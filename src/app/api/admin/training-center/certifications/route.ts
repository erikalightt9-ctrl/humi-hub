import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";

const CERT_THRESHOLD = 75;

/* GET — list all students with their cert eligibility */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") ?? "";
    const courseId = searchParams.get("courseId") ?? undefined;
    const filterStatus = searchParams.get("status") ?? "all"; // all | issued | eligible | not_eligible

    const students = await prisma.student.findMany({
      where: {
        accessGranted: true,
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        ...(courseId ? { enrollment: { courseId } } : {}),
      },
      include: {
        enrollment: { select: { courseId: true, course: { select: { id: true, title: true, slug: true } } } },
        schedule: { select: { id: true, name: true } },
        certificates: { select: { id: true, courseId: true, certNumber: true, issuedAt: true } },
        sessionAttendances: { select: { present: true, scheduleId: true } },
      },
      orderBy: { name: "asc" },
    });

    const results = students.map((s) => {
      const enrolledCourseId = s.enrollment?.courseId ?? null;
      const presentCount = s.sessionAttendances.filter((a) => a.present).length;
      const totalSessions = s.sessionAttendances.length;
      const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : null;
      const isEligible = attendancePct !== null && attendancePct >= CERT_THRESHOLD;
      const cert = enrolledCourseId ? s.certificates.find((c) => c.courseId === enrolledCourseId) : null;

      return {
        studentId: s.id,
        name: s.name,
        email: s.email,
        course: s.enrollment?.course ?? null,
        schedule: s.schedule ?? null,
        presentCount,
        totalSessions,
        attendancePct,
        isEligible,
        certificate: cert ? { id: cert.id, certNumber: cert.certNumber, issuedAt: cert.issuedAt } : null,
        status: cert ? "issued" : isEligible ? "eligible" : "not_eligible",
      };
    });

    const filtered =
      filterStatus === "all"
        ? results
        : results.filter((r) => r.status === filterStatus);

    return NextResponse.json({
      success: true,
      data: {
        participants: filtered,
        totals: {
          all: results.length,
          issued: results.filter((r) => r.status === "issued").length,
          eligible: results.filter((r) => r.status === "eligible").length,
          not_eligible: results.filter((r) => r.status === "not_eligible").length,
        },
        certThreshold: CERT_THRESHOLD,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/training-center/certifications]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* POST — issue a certificate */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { studentId, courseId } = await req.json();
    if (!studentId || !courseId) {
      return NextResponse.json(
        { success: false, data: null, error: "studentId and courseId required" },
        { status: 400 }
      );
    }

    // Check eligibility
    const attRows = await prisma.sessionAttendance.findMany({
      where: { studentId },
      select: { present: true },
    });
    const pct = attRows.length > 0
      ? Math.round(attRows.filter((r) => r.present).length / attRows.length * 100)
      : 0;

    if (pct < CERT_THRESHOLD) {
      return NextResponse.json(
        { success: false, data: null, error: `Attendance ${pct}% is below the ${CERT_THRESHOLD}% threshold` },
        { status: 422 }
      );
    }

    const cert = await prisma.certificate.upsert({
      where: { studentId_courseId: { studentId, courseId } },
      create: { id: createId(), studentId, courseId, certNumber: createId() },
      update: {},
    });

    return NextResponse.json({ success: true, data: cert, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/training-center/certifications]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
