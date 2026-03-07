import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import {
  getScenarios,
  generateScenarioContext,
  evaluateEmail,
} from "@/lib/services/ai-email-practice.service";
import {
  createSession,
  getSession,
  getStudentSessions,
  updateWithEmail,
  updateWithEvaluation,
} from "@/lib/repositories/email-practice.repository";
import {
  generateScenarioSchema,
  evaluateEmailSchema,
} from "@/lib/validations/ai-email-practice.schema";
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
/*  GET -- Available scenarios + past sessions                         */
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
    const courseSlug = await getStudentCourseSlug(studentId);

    if (!courseSlug) {
      return NextResponse.json(
        { success: false, data: null, error: "Course not found" },
        { status: 404 },
      );
    }

    const [scenarios, sessions] = await Promise.all([
      getScenarios(courseSlug),
      getStudentSessions(studentId),
    ]);

    return NextResponse.json({
      success: true,
      data: { scenarios, sessions },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/student/ai-email-practice]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST -- Generate a new scenario                                    */
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
    const body = await request.json();

    const parsed = generateScenarioSchema.safeParse(body);
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

    const allScenarios = getScenarios(courseSlug);
    const template = allScenarios.find(
      (s) => s.type === parsed.data.scenarioType,
    );

    if (!template) {
      return NextResponse.json(
        { success: false, data: null, error: "Scenario type not found" },
        { status: 404 },
      );
    }

    const scenarioContext = await generateScenarioContext(template);

    const session = await createSession({
      studentId,
      courseSlug,
      scenarioType: template.type,
      scenarioPrompt: scenarioContext.context,
      senderRole: template.senderRole,
      recipientRole: template.recipientRole,
    });

    return NextResponse.json({
      success: true,
      data: {
        session,
        context: scenarioContext.context,
        keyPoints: scenarioContext.keyPoints,
      },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/student/ai-email-practice]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PUT -- Submit email for evaluation                                 */
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

    const studentId = token.id as string;
    const body = await request.json();

    const parsed = evaluateEmailSchema.safeParse(body);
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

    const session = await getSession(parsed.data.sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, data: null, error: "Session not found" },
        { status: 404 },
      );
    }

    if (session.studentId !== studentId) {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 403 },
      );
    }

    if (session.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "This session has already been evaluated",
        },
        { status: 400 },
      );
    }

    await updateWithEmail(session.id, parsed.data.email);

    const evaluation = await evaluateEmail(
      session.scenarioPrompt,
      session.senderRole,
      session.recipientRole,
      parsed.data.email,
    );

    const updatedSession = await updateWithEvaluation(session.id, {
      toneScore: evaluation.toneScore,
      clarityScore: evaluation.clarityScore,
      completenessScore: evaluation.completenessScore,
      grammarScore: evaluation.grammarScore,
      industryLanguageScore: evaluation.industryLanguageScore,
      overallScore: evaluation.overallScore,
      aiFeedback: evaluation.feedback,
      suggestedVersion: evaluation.suggestedVersion,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
    });

    return NextResponse.json({
      success: true,
      data: updatedSession,
      error: null,
    });
  } catch (err) {
    console.error("[PUT /api/student/ai-email-practice]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
