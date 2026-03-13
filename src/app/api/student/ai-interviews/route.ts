import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import {
  getInterviewRoles,
  startInterview,
  answerQuestion,
  endInterview,
} from "@/lib/services/ai-interview.service";
import { getStudentSessions } from "@/lib/repositories/interview.repository";
import {
  startInterviewSchema,
  answerQuestionSchema,
  endInterviewSchema,
} from "@/lib/validations/ai-interview.schema";
import { requireSubscription } from "@/lib/guards/subscription.guard";
import type { CourseSlug } from "@/types";

/* ------------------------------------------------------------------ */
/*  Helper: get student's course slug                                  */
/* ------------------------------------------------------------------ */

async function getStudentCourseSlug(
  studentId: string,
): Promise<CourseSlug | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      enrollment: {
        select: { course: { select: { slug: true } } },
      },
    },
  });
  return student?.enrollment.course.slug ?? null;
}

/* ------------------------------------------------------------------ */
/*  GET -- Available roles + past sessions                             */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "student") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const studentId = token.id as string;
    const denied = await requireSubscription(studentId);
    if (denied) return denied;
    const courseSlug = await getStudentCourseSlug(studentId);

    if (!courseSlug) {
      return NextResponse.json(
        { success: false, data: null, error: "Course not found" },
        { status: 404 },
      );
    }

    const [roles, sessions] = await Promise.all([
      getInterviewRoles(courseSlug),
      getStudentSessions(studentId),
    ]);

    return NextResponse.json({
      success: true,
      data: { roles, sessions },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/student/ai-interviews]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST -- Start / Answer / End                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "student") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const studentId = token.id as string;
    const denied = await requireSubscription(studentId);
    if (denied) return denied;
    const body = await request.json();
    const action = body.action as string;

    // --- Start interview ---
    if (action === "start") {
      const parsed = startInterviewSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error:
              parsed.error.issues[0]?.message ?? "Invalid request",
          },
          { status: 400 },
        );
      }

      const courseSlug = await getStudentCourseSlug(studentId);
      if (!courseSlug) {
        return NextResponse.json(
          { success: false, data: null, error: "Course not found" },
          { status: 404 },
        );
      }

      const result = await startInterview(
        studentId,
        parsed.data.role,
        courseSlug,
      );

      return NextResponse.json({
        success: true,
        data: result,
        error: null,
      });
    }

    // --- Answer question ---
    if (action === "answer") {
      const parsed = answerQuestionSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error:
              parsed.error.issues[0]?.message ?? "Invalid request",
          },
          { status: 400 },
        );
      }

      const session = await answerQuestion(
        parsed.data.sessionId,
        parsed.data.answer,
      );

      return NextResponse.json({
        success: true,
        data: session,
        error: null,
      });
    }

    // --- End interview ---
    if (action === "end") {
      const parsed = endInterviewSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error:
              parsed.error.issues[0]?.message ?? "Invalid request",
          },
          { status: 400 },
        );
      }

      const session = await endInterview(parsed.data.sessionId);

      return NextResponse.json({
        success: true,
        data: session,
        error: null,
      });
    }

    return NextResponse.json(
      { success: false, data: null, error: "Invalid action" },
      { status: 400 },
    );
  } catch (err) {
    console.error("[POST /api/student/ai-interviews]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
