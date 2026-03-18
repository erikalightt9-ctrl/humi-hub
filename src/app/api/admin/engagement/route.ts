import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { getStudentEngagement } from "@/lib/repositories/engagement.repository";

const SORT_FIELDS = [
  "studentName",
  "lessonsCompleted",
  "quizAvgScore",
  "assignmentsSubmitted",
  "forumPosts",
  "lastActiveAt",
  "totalPoints",
] as const;

const querySchema = z.object({
  courseId: z.string().min(1).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(SORT_FIELDS, { error: "Invalid sort field" }).default("studentName"),
  sortOrder: z.enum(["asc", "desc"] as const).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const rawParams = Object.fromEntries(
      request.nextUrl.searchParams.entries()
    );
    const result = querySchema.safeParse(rawParams);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: result.error.issues[0]?.message ?? "Invalid parameters",
        },
        { status: 400 }
      );
    }

    const data = await getStudentEngagement({ ...result.data, tenantId: guard.tenantId });

    return NextResponse.json({ success: true, data, error: null });
  } catch (error) {
    console.error("[Engagement API] Error:", error);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to fetch engagement data" },
      { status: 500 }
    );
  }
}
