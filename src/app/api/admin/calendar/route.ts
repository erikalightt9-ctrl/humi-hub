import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { createEventSchema } from "@/lib/validations/calendar.schema";
import {
  getEventsByDateRange,
  createEvent,
  updateEvent,
  hasTimeOverlap,
  getCalendarKpi,
} from "@/lib/repositories/calendar.repository";
import { getToken as getGoogleToken } from "@/lib/repositories/google-token.repository";
import { createGoogleEvent } from "@/lib/services/google-calendar.service";
import type { EventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function jsonError(msg: string, status: number) {
  return NextResponse.json({ success: false, data: null, error: msg }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) return jsonError("Unauthorized", 401);

    const { searchParams } = request.nextUrl;

    // KPI endpoint
    if (searchParams.get("kpi") === "1") {
      const kpi = await getCalendarKpi({ role: "admin", userId: token.id as string });
      return NextResponse.json({ success: true, data: kpi, error: null });
    }

    const year = parseInt(
      searchParams.get("year") ?? String(new Date().getFullYear()),
      10,
    );
    const month = parseInt(
      searchParams.get("month") ?? String(new Date().getMonth() + 1),
      10,
    );
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const events = await getEventsByDateRange(startDate, endDate, null, {
      role: "admin",
      userId: token.id as string,
    });

    return NextResponse.json({ success: true, data: events, error: null });
  } catch (err) {
    console.error("[GET /api/admin/calendar]", err);
    return jsonError("Internal server error", 500);
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
      return jsonError(firstError, 422);
    }

    const d = result.data;

    // Overlap detection when both times are provided
    if (d.startTime && d.endTime) {
      if (d.endTime <= d.startTime) {
        return jsonError("End time must be after start time", 422);
      }
      const overlap = await hasTimeOverlap({
        date: d.date,
        startTime: d.startTime,
        endTime: d.endTime,
      });
      if (overlap) {
        return jsonError("This time slot overlaps with an existing event", 409);
      }
    }

    const userId   = token!.id as string;
    const userRole = (token!.role as string) ?? "admin";

    // Create the local event
    const event = await createEvent({
      title: d.title,
      description: d.description ?? null,
      date: new Date(d.date),
      endDate: d.endDate ? new Date(d.endDate) : null,
      startTime: d.startTime ?? null,
      endTime: d.endTime ?? null,
      type: d.type as EventType,
      courseId: d.courseId ?? null,
      assignedUserId: d.assignedUserId ?? null,
      createdBy: userId,
      creatorRole: userRole,
      isPublished: d.isPublished,
    });

    // ── Google Calendar sync (fire-and-forget) ────────────────────────────────
    const googleToken = await getGoogleToken(userId, userRole);
    if (googleToken) {
      const googleEventId = await createGoogleEvent(googleToken, {
        title: event.title,
        description: event.description,
        date: d.date,
        startTime: event.startTime,
        endTime: event.endTime,
        timezone: process.env.DEFAULT_TIMEZONE ?? "UTC",
      });
      if (googleEventId) {
        // Persist the googleEventId back to the local event
        await updateEvent(event.id, { googleEventId } as Parameters<typeof updateEvent>[1]);
      }
    }

    return NextResponse.json({ success: true, data: event, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/calendar]", err);
    return jsonError("Internal server error", 500);
  }
}
