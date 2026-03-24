import { prisma } from "@/lib/prisma";
import {
  addToWaitlist,
  listWaitlistBySchedule,
  promoteNextWaitlistEntry,
  cancelWaitlistEntry,
  countWaitingEntries,
  getWaitlistPosition,
} from "@/lib/repositories/waitlist.repository";
import {
  sendWaitlistJoinedEmail,
  sendWaitlistPromotedEmail,
} from "@/lib/email/send-waitlist-notification";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type JoinWaitlistResult =
  | { success: true; position: number; alreadyOnWaitlist?: boolean }
  | { success: false; code: "SCHEDULE_NOT_FOUND" | "ENROLLMENT_NOT_FOUND" | "SCHEDULE_HAS_SEATS"; message: string };

export type PromoteResult =
  | { success: true; promoted: boolean; fullName?: string; email?: string }
  | { success: false; code: "SCHEDULE_NOT_FOUND"; message: string };

/* ------------------------------------------------------------------ */
/*  Join Waitlist                                                      */
/* ------------------------------------------------------------------ */

export async function joinWaitlist(
  scheduleId: string,
  enrollmentId: string,
): Promise<JoinWaitlistResult> {
  // Validate schedule exists
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { _count: { select: { enrollments: true } }, course: { select: { title: true } } },
  });

  if (!schedule) {
    return { success: false, code: "SCHEDULE_NOT_FOUND", message: "Schedule not found." };
  }

  // Validate enrollment exists
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, fullName: true, email: true },
  });

  if (!enrollment) {
    return { success: false, code: "ENROLLMENT_NOT_FOUND", message: "Enrollment not found." };
  }

  // Check if schedule actually has open seats — if it does, they shouldn't be on the waitlist
  if (schedule._count.enrollments < schedule.maxCapacity && schedule.status === "OPEN") {
    return {
      success: false,
      code: "SCHEDULE_HAS_SEATS",
      message: "This session still has available seats. No waitlist needed.",
    };
  }

  // Check if already on waitlist
  const existingPosition = await getWaitlistPosition(scheduleId, enrollmentId);
  if (existingPosition !== null) {
    return { success: true, position: existingPosition, alreadyOnWaitlist: true };
  }

  // Add to waitlist
  const entry = await addToWaitlist(scheduleId, enrollmentId);

  // Send confirmation email (fire-and-forget, log errors)
  sendWaitlistJoinedEmail({
    email: enrollment.email,
    fullName: enrollment.fullName,
    courseTitle: schedule.course.title,
    scheduleName: schedule.name,
    position: entry.position,
  }).catch((err) => console.error("[Waitlist] Failed to send joined email:", err));

  return { success: true, position: entry.position };
}

/* ------------------------------------------------------------------ */
/*  Promote next person when a seat opens up                          */
/* ------------------------------------------------------------------ */

export async function promoteWaitlistOnSeatOpen(
  scheduleId: string,
): Promise<PromoteResult> {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { course: { select: { title: true } } },
  });

  if (!schedule) {
    return { success: false, code: "SCHEDULE_NOT_FOUND", message: "Schedule not found." };
  }

  const promoted = await promoteNextWaitlistEntry(scheduleId);

  if (!promoted) {
    return { success: true, promoted: false };
  }

  // Send seat-opened email
  sendWaitlistPromotedEmail({
    email: promoted.enrollment.email,
    fullName: promoted.enrollment.fullName,
    courseTitle: schedule.course.title,
    scheduleName: schedule.name,
    enrollmentId: promoted.enrollment.id,
  }).catch((err) => console.error("[Waitlist] Failed to send promotion email:", err));

  return {
    success: true,
    promoted: true,
    fullName: promoted.enrollment.fullName,
    email: promoted.enrollment.email,
  };
}

/* ------------------------------------------------------------------ */
/*  Re-exports for convenience                                         */
/* ------------------------------------------------------------------ */

export {
  listWaitlistBySchedule,
  cancelWaitlistEntry,
  countWaitingEntries,
  getWaitlistPosition,
};
