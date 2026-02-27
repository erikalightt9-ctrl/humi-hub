import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getThreadWithPosts } from "@/lib/repositories/forum.repository";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const { threadId } = await params;
    const thread = await getThreadWithPosts(threadId);
    if (!thread) {
      return NextResponse.json({ success: false, data: null, error: "Thread not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: thread, error: null });
  } catch (err) {
    console.error("[GET /api/student/forum/[threadId]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
