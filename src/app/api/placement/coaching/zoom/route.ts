import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createZoomMeeting, isZoomAvailable } from "@/lib/zoom";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const zoomSchema = z.object({
  sessionId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().min(15).max(120).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    // Allow both admins and students to create zoom links
    if (!token) {
      return NextResponse.json(
        { success: false, data: null, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!isZoomAvailable()) {
      return NextResponse.json(
        { success: false, data: null, error: "Zoom is not configured. Please add ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET to your environment." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const parsed = zoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "sessionId and scheduledAt (ISO datetime) are required" },
        { status: 400 }
      );
    }

    const { sessionId, scheduledAt, durationMinutes } = parsed.data;

    const coaching = await prisma.coachingSession.findUnique({ where: { id: sessionId } });
    if (!coaching) {
      return NextResponse.json(
        { success: false, data: null, error: "Coaching session not found" },
        { status: 404 }
      );
    }

    const meeting = await createZoomMeeting({
      topic: `Career Coaching: ${coaching.topic}`,
      startTime: scheduledAt,
      durationMinutes: durationMinutes ?? 60,
    });

    const updated = await prisma.coachingSession.update({
      where: { id: sessionId },
      data: {
        scheduledAt: new Date(scheduledAt),
        status: "CONFIRMED",
        zoomMeetingId: meeting.id,
        zoomJoinUrl: meeting.join_url,
        zoomStartUrl: meeting.start_url,
        zoomPassword: meeting.password,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        zoomJoinUrl: meeting.join_url,
        zoomPassword: meeting.password,
        scheduledAt,
        session: updated,
      },
      error: null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create Zoom meeting";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
