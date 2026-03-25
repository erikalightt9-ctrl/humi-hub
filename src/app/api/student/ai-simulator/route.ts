import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import {
  getScenariosForCourse,
  startSimulation,
  sendMessage,
  endSimulation,
} from "@/lib/services/ai-simulator.service";
import { getStudentSessions } from "@/lib/repositories/simulation.repository";
import {
  startSimulationSchema,
  sendMessageSchema,
  endSimulationSchema,
} from "@/lib/validations/ai-simulator.schema";
import { requireSubscription } from "@/lib/guards/subscription.guard";
import { requireFeature } from "@/lib/require-feature";
import { FEATURES } from "@/lib/feature-flags";
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
/*  GET — Scenarios + past sessions                                    */
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

    const [scenarios, sessions] = await Promise.all([
      getScenariosForCourse(courseSlug),
      getStudentSessions(studentId),
    ]);

    return NextResponse.json({
      success: true,
      data: { scenarios, sessions },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/student/ai-simulator]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Start simulation / Send message / End simulation            */
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
    const featureCheck = await requireFeature((token.tenantId as string | undefined) ?? null, FEATURES.AI_SIMULATIONS);
    if (!featureCheck.ok) return featureCheck.response;
    const body = await request.json();
    const action = body.action as string;

    // --- Start simulation ---
    if (action === "start") {
      const parsed = startSimulationSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, data: null, error: "Invalid request" },
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

      const result = await startSimulation(
        studentId,
        parsed.data.scenarioId,
        courseSlug,
      );

      return NextResponse.json({
        success: true,
        data: result,
        error: null,
      });
    }

    // --- Send message ---
    if (action === "message") {
      const parsed = sendMessageSchema.safeParse(body);
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

      const session = await sendMessage(
        parsed.data.sessionId,
        parsed.data.message,
      );

      return NextResponse.json({
        success: true,
        data: session,
        error: null,
      });
    }

    // --- End simulation ---
    if (action === "end") {
      const parsed = endSimulationSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, data: null, error: "Invalid request" },
          { status: 400 },
        );
      }

      const session = await endSimulation(parsed.data.sessionId);

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
    console.error("[POST /api/student/ai-simulator]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
