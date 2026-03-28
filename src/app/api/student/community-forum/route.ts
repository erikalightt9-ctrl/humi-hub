import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireFeature } from "@/lib/require-feature";
import { FEATURES } from "@/lib/feature-flags";

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

const createThreadSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(5000),
});

/* ------------------------------------------------------------------ */
/*  GET — Community threads (courseId IS NULL)                          */
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

    const threads = await prisma.forumThread.findMany({
      where: { courseId: null },
      include: {
        student: { select: { name: true } },
        _count: { select: { posts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: threads,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/student/community-forum]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create community thread (courseId = null)                    */
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
    const featureCheck = await requireFeature((token.tenantId as string | undefined) ?? null, FEATURES.FORUM);
    if (!featureCheck.ok) return featureCheck.response;
    const body = await request.json();
    const result = createThreadSchema.safeParse(body);

    if (!result.success) {
      const firstError =
        result.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstError },
        { status: 422 },
      );
    }

    const { title, content } = result.data;

    const thread = await prisma.forumThread.create({
      data: {
        courseId: null,
        studentId,
        title,
        posts: {
          create: { studentId, content },
        },
      },
      include: { posts: true },
    });

    return NextResponse.json(
      { success: true, data: thread, error: null },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/student/community-forum]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
