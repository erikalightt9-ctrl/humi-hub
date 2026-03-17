import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { createEventSchema } from "@/lib/validations/calendar.schema";
import {
  getEventsByDateRange,
  createEvent,
} from "@/lib/repositories/calendar.repository";
import type { EventType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1), 10);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month

    const events = await getEventsByDateRange(startDate, endDate);

    return NextResponse.json({ success: true, data: events, error: null });
  } catch (err) {
    console.error("[GET /api/admin/calendar]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const result = createEventSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Invalid data";
      return NextResponse.json(
        { success: false, data: null, error: firstError },
        { status: 422 },
      );
    }

    const event = await createEvent({
      title: result.data.title,
      description: result.data.description ?? null,
      date: new Date(result.data.date),
      endDate: result.data.endDate ? new Date(result.data.endDate) : null,
      type: result.data.type as EventType,
      courseId: result.data.courseId ?? null,
      createdBy: token!.id as string,
      isPublished: result.data.isPublished,
    });

    return NextResponse.json({ success: true, data: event, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/calendar]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
