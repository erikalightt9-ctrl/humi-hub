import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  getTrainerAvailability,
  replaceTrainerAvailability,
  checkScheduleConflict,
} from "@/lib/repositories/trainer-availability.repository";

/* ------------------------------------------------------------------ */
/*  GET /api/admin/trainers/[id]/availability                          */
/*  Query: ?checkDays=1,3,5&startTime=09:00&endTime=11:00  (optional) */
/* ------------------------------------------------------------------ */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken({ req: req, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  const { id: trainerId } = await params;
  const { searchParams } = req.nextUrl;
  const checkDaysStr = searchParams.get("checkDays");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");

  const slots = await getTrainerAvailability(trainerId);

  // Optional: also return conflict check result
  if (checkDaysStr && startTime && endTime) {
    const days = checkDaysStr.split(",").map(Number).filter((n) => !isNaN(n));
    const conflict = await checkScheduleConflict(trainerId, days, startTime, endTime);
    return NextResponse.json({ success: true, data: { slots, conflict } });
  }

  return NextResponse.json({ success: true, data: { slots } });
}

/* ------------------------------------------------------------------ */
/*  PUT /api/admin/trainers/[id]/availability                          */
/*  Body: { slots: [{dayOfWeek, startTime, endTime}] }                 */
/* ------------------------------------------------------------------ */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken({ req: req, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  const { id: trainerId } = await params;
  const body = await req.json();
  const { slots } = body;

  if (!Array.isArray(slots)) {
    return NextResponse.json(
      { success: false, error: "slots must be an array" },
      { status: 400 },
    );
  }

  // Validate each slot
  for (const s of slots) {
    if (
      typeof s.dayOfWeek !== "number" ||
      s.dayOfWeek < 0 ||
      s.dayOfWeek > 6 ||
      typeof s.startTime !== "string" ||
      typeof s.endTime !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "Each slot needs dayOfWeek (0-6), startTime, endTime" },
        { status: 400 },
      );
    }
  }

  const updated = await replaceTrainerAvailability(trainerId, slots);
  return NextResponse.json({ success: true, data: updated });
}
