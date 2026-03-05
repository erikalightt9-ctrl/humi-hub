import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { generateTask, evaluateTaskAnswer } from "@/lib/services/ai-task-generator.service";
import { generateTaskSchema, evaluateTaskSchema } from "@/lib/validations/ai-task.schema";
import type { CourseSlug } from "@prisma/client";

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
/*  POST — Generate a new task                                         */
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

    const body = await request.json();
    const parsed = generateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid request" },
        { status: 400 },
      );
    }

    const courseSlug = await getStudentCourseSlug(token.id as string);
    if (!courseSlug) {
      return NextResponse.json(
        { success: false, data: null, error: "Course not found" },
        { status: 404 },
      );
    }

    const task = await generateTask(courseSlug, parsed.data.difficulty);

    return NextResponse.json({
      success: true,
      data: task,
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/student/ai-tasks]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PUT — Evaluate a task answer                                       */
/* ------------------------------------------------------------------ */

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const parsed = evaluateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: parsed.error.issues[0]?.message ?? "Invalid request",
        },
        { status: 400 },
      );
    }

    const feedback = await evaluateTaskAnswer(parsed.data.task, parsed.data.answer);

    return NextResponse.json({
      success: true,
      data: feedback,
      error: null,
    });
  } catch (err) {
    console.error("[PUT /api/student/ai-tasks]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
