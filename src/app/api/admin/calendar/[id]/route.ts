import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { updateEventSchema } from "@/lib/validations/calendar.schema";
import {
  getEventById,
  updateEvent,
  deleteEvent,
  hasTimeOverlap,
} from "@/lib/repositories/calendar.repository";
import { getToken as getGoogleToken } from "@/lib/repositories/google-token.repository";
import {
  updateGoogleEvent,
  deleteGoogleEvent,
} from "@/lib/services/google-calendar.service";
import type { EventType } from "@prisma/client";

function jsonError(msg: string, status: number) {
  return NextResponse.json({ success: false, data: null, error: msg }, { status });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const event = await getEventById(id);
    if (!event) return jsonError("Event not found", 404);
    return NextResponse.json({ success: true, data: event, error: null });
  } catch (err) {
    console.error("[GET /api/admin/calendar/[id]]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const existing = await getEventById(id);
    if (!existing) return jsonError("Event not found", 404);

    const body = await request.json();
    const result = updateEventSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Invalid data";
      return jsonError(firstError, 422);
    }

    const d = result.data;

    // Resolve final date, startTime, endTime for overlap check
    const finalDate  = d.date ?? existing.date.toISOString().split("T")[0];
    const finalStart = d.startTime !== undefined ? d.startTime : existing.startTime;
    const finalEnd   = d.endTime !== undefined ? d.endTime : existing.endTime;

    if (finalStart && finalEnd) {
      if (finalEnd <= finalStart) {
        return jsonError("End time must be after start time", 422);
      }
      const overlap = await hasTimeOverlap({
        date: finalDate,
        startTime: finalStart,
        endTime: finalEnd,
        excludeId: id,
      });
      if (overlap) {
        return jsonError("This time slot overlaps with an existing event", 409);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (d.title !== undefined) updateData.title = d.title;
    if (d.description !== undefined) updateData.description = d.description;
    if (d.date !== undefined) updateData.date = new Date(d.date);
    if (d.endDate !== undefined) updateData.endDate = d.endDate ? new Date(d.endDate) : null;
    if (d.startTime !== undefined) updateData.startTime = d.startTime ?? null;
    if (d.endTime !== undefined) updateData.endTime = d.endTime ?? null;
    if (d.type !== undefined) updateData.type = d.type as EventType;
    if (d.courseId !== undefined) updateData.courseId = d.courseId ?? null;
    if (d.assignedUserId !== undefined) updateData.assignedUserId = d.assignedUserId ?? null;
    if (d.isPublished !== undefined) updateData.isPublished = d.isPublished;

    const updated = await updateEvent(id, updateData);

    // ── Google Calendar sync ─────────────────────────────────────────────────
    if (existing.googleEventId) {
      const userId   = token!.id as string;
      const userRole = (token!.role as string) ?? "admin";
      const googleToken = await getGoogleToken(userId, userRole);
      if (googleToken) {
        await updateGoogleEvent(googleToken, existing.googleEventId, {
          title: updated.title,
          description: updated.description,
          date: finalDate,
          startTime: finalStart,
          endTime: finalEnd,
          timezone: process.env.DEFAULT_TIMEZONE ?? "UTC",
        });
      }
    }

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PUT /api/admin/calendar/[id]]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const existing = await getEventById(id);
    if (!existing) return jsonError("Event not found", 404);

    // ── Google Calendar sync (delete before local delete) ────────────────────
    if (existing.googleEventId) {
      const userId   = token!.id as string;
      const userRole = (token!.role as string) ?? "admin";
      const googleToken = await getGoogleToken(userId, userRole);
      if (googleToken) {
        await deleteGoogleEvent(googleToken, existing.googleEventId);
      }
    }

    await deleteEvent(id);
    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[DELETE /api/admin/calendar/[id]]", err);
    return jsonError("Internal server error", 500);
  }
}
