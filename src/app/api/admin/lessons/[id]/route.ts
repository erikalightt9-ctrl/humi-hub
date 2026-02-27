import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { updateLesson, deleteLesson } from "@/lib/repositories/lesson.repository";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  order: z.number().int().min(1).optional(),
  durationMin: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, data: null, error: "Invalid input" }, { status: 422 });
    }
    const lesson = await updateLesson(id, result.data);
    return NextResponse.json({ success: true, data: lesson, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/lessons/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await deleteLesson(id);
    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[DELETE /api/admin/lessons/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
