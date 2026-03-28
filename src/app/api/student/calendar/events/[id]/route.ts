import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  type: z
    .enum(["CUSTOM", "DEADLINE", "ANNOUNCEMENT", "ORIENTATION", "HOLIDAY", "CLASS", "MEETING"])
    .optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    // Verify ownership — student can only edit their own events
    const existing = await prisma.calendarEvent.findFirst({
      where: { id, creatorRole: "student", createdBy: token.id as string },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Event not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const result = updateEventSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: result.error.issues[0]?.message ?? "Invalid input",
        },
        { status: 422 },
      );
    }

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(result.data.title !== undefined ? { title: result.data.title } : {}),
        ...(result.data.description !== undefined
          ? { description: result.data.description }
          : {}),
        ...(result.data.date !== undefined ? { date: new Date(result.data.date) } : {}),
        ...(result.data.endDate !== undefined
          ? { endDate: result.data.endDate ? new Date(result.data.endDate) : null }
          : {}),
        ...(result.data.startTime !== undefined ? { startTime: result.data.startTime } : {}),
        ...(result.data.endTime !== undefined ? { endTime: result.data.endTime } : {}),
        ...(result.data.type !== undefined ? { type: result.data.type } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PUT /api/student/calendar/events/[id]]", err);
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
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const existing = await prisma.calendarEvent.findFirst({
      where: { id, creatorRole: "student", createdBy: token.id as string },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Event not found" },
        { status: 404 },
      );
    }

    await prisma.calendarEvent.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { deleted: true }, error: null });
  } catch (err) {
    console.error("[DELETE /api/student/calendar/events/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
