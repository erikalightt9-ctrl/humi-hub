import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET — Trainer: detailed student progress                           */
/* ------------------------------------------------------------------ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "trainer") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { studentId } = await params;
    const trainerId = token.id as string;

    // Verify student belongs to this trainer
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        trainerId: true,
        enrollment: {
          select: { courseId: true, course: { select: { title: true } } },
        },
      },
    });

    if (!student || student.trainerId !== trainerId) {
      return NextResponse.json(
        { success: false, data: null, error: "Student not found or not assigned" },
        { status: 404 },
      );
    }

    const courseId = student.enrollment.courseId;

    const [totalLessons, completedLessons, submissions, quizAttempts] =
      await Promise.all([
        prisma.lesson.count({
          where: { courseId, isPublished: true },
        }),
        prisma.lessonCompletion.count({
          where: { studentId, lesson: { courseId } },
        }),
        prisma.submission.findMany({
          where: { studentId },
          include: {
            assignment: {
              select: { title: true, maxPoints: true },
            },
          },
          orderBy: { submittedAt: "desc" },
        }),
        prisma.quizAttempt.findMany({
          where: { studentId, quiz: { courseId } },
          include: {
            quiz: { select: { title: true, passingScore: true } },
          },
          orderBy: { completedAt: "desc" },
        }),
      ]);

    const lessonProgress = {
      completed: completedLessons,
      total: totalLessons,
      percent:
        totalLessons === 0
          ? 0
          : Math.round((completedLessons / totalLessons) * 100),
    };

    return NextResponse.json({
      success: true,
      data: {
        courseName: student.enrollment.course.title,
        lessonProgress,
        submissions: submissions.map((s) => ({
          id: s.id,
          assignmentTitle: s.assignment.title,
          maxPoints: s.assignment.maxPoints,
          status: s.status,
          grade: s.grade,
          submittedAt: s.submittedAt,
          gradedAt: s.gradedAt,
        })),
        quizAttempts: quizAttempts.map((a) => ({
          id: a.id,
          quizTitle: a.quiz.title,
          score: a.score,
          passed: a.passed,
          passingScore: a.quiz.passingScore,
          completedAt: a.completedAt,
        })),
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/trainer/students/[studentId]/progress]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
