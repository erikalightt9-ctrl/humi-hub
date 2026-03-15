import { NextRequest, NextResponse } from "next/server";
import { checkScheduleConflict, getTrainerAvailability } from "@/lib/repositories/trainer-availability.repository";

/**
 * GET /api/public/trainer-availability
 * Query: trainerId, checkDays (comma-separated), startTime, endTime
 *
 * Used by ScheduleDialog to show conflict warnings when assigning a trainer.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const trainerId = searchParams.get("trainerId");
  const checkDaysStr = searchParams.get("checkDays");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");

  if (!trainerId) {
    return NextResponse.json({ success: false, error: "trainerId is required" }, { status: 400 });
  }

  const slots = await getTrainerAvailability(trainerId);

  if (checkDaysStr && startTime && endTime) {
    const days = checkDaysStr.split(",").map(Number).filter((n) => !isNaN(n));
    const conflict = await checkScheduleConflict(trainerId, days, startTime, endTime);
    return NextResponse.json({ success: true, data: { slots, conflict } });
  }

  return NextResponse.json({ success: true, data: { slots } });
}
