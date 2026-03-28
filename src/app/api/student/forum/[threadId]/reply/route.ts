import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { createReply } from "@/lib/repositories/forum.repository";
import { onForumPost } from "@/lib/services/gamification.service";
import { requireFeature } from "@/lib/require-feature";
import { FEATURES } from "@/lib/feature-flags";

const replySchema = z.object({
  content: z.string().min(1).max(5000),
  parentId: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const studentId = token.id as string;
    const featureCheck = await requireFeature((token.tenantId as string | undefined) ?? null, FEATURES.FORUM);
    if (!featureCheck.ok) return featureCheck.response;
    const { threadId } = await params;
    const body = await request.json();
    const result = replySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, data: null, error: "Invalid input" }, { status: 422 });
    }
    const post = await createReply(threadId, studentId, result.data.content, result.data.parentId);
    await onForumPost(studentId);
    return NextResponse.json({ success: true, data: post, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/student/forum/[threadId]/reply]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
