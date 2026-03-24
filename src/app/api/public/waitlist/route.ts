import { NextRequest, NextResponse } from "next/server";
import { joinWaitlist } from "@/lib/services/waitlist.service";
import { getWaitlistPosition } from "@/lib/repositories/waitlist.repository";
import { z } from "zod";

const JoinSchema = z.object({
  scheduleId: z.string().min(1),
  enrollmentId: z.string().min(1),
});

/* ------------------------------------------------------------------ */
/*  POST — Join waitlist for a full schedule                           */
/*  Body: { scheduleId, enrollmentId }                                 */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = JoinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: "scheduleId and enrollmentId are required" },
        { status: 400 },
      );
    }

    const { scheduleId, enrollmentId } = parsed.data;

    const result = await joinWaitlist(scheduleId, enrollmentId);

    if (!result.success) {
      const status =
        result.code === "SCHEDULE_HAS_SEATS" ? 409 :
        result.code === "SCHEDULE_NOT_FOUND" ? 404 :
        result.code === "ENROLLMENT_NOT_FOUND" ? 404 : 400;

      return NextResponse.json(
        { success: false, data: null, error: result.message },
        { status },
      );
    }

    return NextResponse.json({
      success: true,
      data: { position: result.position, alreadyOnWaitlist: result.alreadyOnWaitlist ?? false },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/public/waitlist]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  GET — Check waitlist position for an enrollment                    */
/*  Query params: scheduleId, enrollmentId                             */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("scheduleId");
    const enrollmentId = searchParams.get("enrollmentId");

    if (!scheduleId || !enrollmentId) {
      return NextResponse.json(
        { success: false, data: null, error: "scheduleId and enrollmentId are required" },
        { status: 400 },
      );
    }

    const position = await getWaitlistPosition(scheduleId, enrollmentId);

    return NextResponse.json({
      success: true,
      data: { position },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/public/waitlist]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
