import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { listSchedules, createSchedule, getScheduleStats } from "@/lib/repositories/schedule.repository";
import { createScheduleSchema } from "@/lib/validations/schedule.schema";
import type { ScheduleStatus } from "@prisma/client";
import type { CourseSlug } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);

    const filters = {
      search: searchParams.get("search") ?? undefined,
      courseSlug: searchParams.get("courseSlug") ?? undefined,
      status: (searchParams.get("status") as ScheduleStatus) ?? undefined,
      page: parseInt(searchParams.get("page") ?? "1", 10),
      limit: parseInt(searchParams.get("limit") ?? "20", 10),
    };

    const [schedules, stats] = await Promise.all([
      listSchedules(filters),
      getScheduleStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: { schedules, stats },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/schedules]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const result = createScheduleSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Validation failed";
      return NextResponse.json(
        { success: false, data: null, error: firstError },
        { status: 422 }
      );
    }

    const schedule = await createSchedule(result.data);

    return NextResponse.json(
      { success: true, data: schedule, error: null },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/schedules]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
