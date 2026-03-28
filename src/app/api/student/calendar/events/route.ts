import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  type: z
    .enum(["CUSTOM", "DEADLINE", "ANNOUNCEMENT", "ORIENTATION", "HOLIDAY", "CLASS", "MEETING"])
    .default("CUSTOM"),
});

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "student") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const result = createEventSchema.safeParse(body);
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

    const { title, description, date, endDate, startTime, endTime, type } = result.data;

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description: description ?? null,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        startTime: startTime ?? null,
        endTime: endTime ?? null,
        type,
        createdBy: token.id as string,
        assignedUserId: token.id as string,
        creatorRole: "student",
        isPublished: true,
      },
    });

    return NextResponse.json({ success: true, data: event, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/student/calendar/events]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
