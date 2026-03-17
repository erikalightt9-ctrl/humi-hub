import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { z } from "zod";
import {
  getModulesByCourse,
  createModule,
} from "@/lib/repositories/module.repository";

const createSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  order: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;
    const courseId = request.nextUrl.searchParams.get("courseId");
    if (!courseId) {
      return NextResponse.json({ success: false, data: null, error: "courseId is required" }, { status: 422 });
    }
    const modules = await getModulesByCourse(courseId);
    return NextResponse.json({ success: true, data: modules, error: null });
  } catch (err) {
    console.error("[GET /api/admin/modules]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;
    const body = await request.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, data: null, error: result.error.issues[0].message }, { status: 422 });
    }
    const module = await createModule(result.data);
    return NextResponse.json({ success: true, data: module, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/modules]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
