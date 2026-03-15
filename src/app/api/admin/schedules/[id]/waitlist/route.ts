import { NextRequest, NextResponse } from "next/server";
import {
  listWaitlistBySchedule,
  promoteNextWaitlistEntry,
  cancelWaitlistEntry,
} from "@/lib/repositories/waitlist.repository";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/* ------------------------------------------------------------------ */
/*  GET /api/admin/schedules/[id]/waitlist                             */
/*  Returns WAITING entries for a schedule                            */
/* ------------------------------------------------------------------ */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: scheduleId } = await params;
  const entries = await listWaitlistBySchedule(scheduleId, "WAITING");
  return NextResponse.json({ success: true, data: entries });
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/schedules/[id]/waitlist                            */
/*  Body: { action: "promote" | "cancel", enrollmentId }              */
/* ------------------------------------------------------------------ */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: scheduleId } = await params;
  const body = await req.json();
  const { action, enrollmentId } = body;

  if (action === "promote") {
    const promoted = await promoteNextWaitlistEntry(scheduleId);
    if (!promoted) {
      return NextResponse.json(
        { success: false, error: "No waiting entries to promote" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: promoted });
  }

  if (action === "cancel") {
    if (!enrollmentId) {
      return NextResponse.json(
        { success: false, error: "enrollmentId is required for cancel action" },
        { status: 400 },
      );
    }
    const cancelled = await cancelWaitlistEntry(scheduleId, enrollmentId);
    if (!cancelled) {
      return NextResponse.json(
        { success: false, error: "Waitlist entry not found or already processed" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: cancelled });
  }

  return NextResponse.json(
    { success: false, error: "action must be 'promote' or 'cancel'" },
    { status: 400 },
  );
}
