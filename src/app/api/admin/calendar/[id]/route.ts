import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { updateEventSchema } from "@/lib/validations/calendar.schema";
import {
  getEventById,
  updateEvent,
  deleteEvent,
} from "@/lib/repositories/calendar.repository";
import type { EventType } from "@prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json(
        { success: false, data: null, error: "Event not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: event, error: null });
  } catch (err) {
    console.error("[GET /api/admin/calendar/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
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
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Event not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const result = updateEventSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Invalid data";
      return NextResponse.json(
        { success: false, data: null, error: firstError },
        { status: 422 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (result.data.title !== undefined) updateData.title = result.data.title;
    if (result.data.description !== undefined) updateData.description = result.data.description;
    if (result.data.date !== undefined) updateData.date = new Date(result.data.date);
    if (result.data.endDate !== undefined) updateData.endDate = result.data.endDate ? new Date(result.data.endDate) : null;
    if (result.data.type !== undefined) updateData.type = result.data.type as EventType;
    if (result.data.courseId !== undefined) updateData.courseId = result.data.courseId ?? null;
    if (result.data.isPublished !== undefined) updateData.isPublished = result.data.isPublished;

    const updated = await updateEvent(id, updateData);

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PUT /api/admin/calendar/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
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
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Event not found" },
        { status: 404 },
      );
    }

    await deleteEvent(id);

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[DELETE /api/admin/calendar/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
