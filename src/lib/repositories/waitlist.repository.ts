import { prisma } from "@/lib/prisma";
import type { Waitlist, WaitlistStatus, Prisma } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type WaitlistEntry = Waitlist & {
  enrollment: {
    readonly id: string;
    readonly fullName: string;
    readonly email: string;
  };
};

/* ------------------------------------------------------------------ */
/*  Add to waitlist                                                    */
/* ------------------------------------------------------------------ */

export async function addToWaitlist(
  scheduleId: string,
  enrollmentId: string,
): Promise<Waitlist> {
  // Get next position
  const lastEntry = await prisma.waitlist.findFirst({
    where: { scheduleId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const nextPosition = (lastEntry?.position ?? 0) + 1;

  return prisma.waitlist.create({
    data: {
      scheduleId,
      enrollmentId,
      position: nextPosition,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  List waitlist entries for a schedule                                */
/* ------------------------------------------------------------------ */

export async function listWaitlistBySchedule(
  scheduleId: string,
  status?: WaitlistStatus,
): Promise<ReadonlyArray<WaitlistEntry>> {
  const where: Prisma.WaitlistWhereInput = { scheduleId };
  if (status) where.status = status;

  return prisma.waitlist.findMany({
    where,
    include: {
      enrollment: {
        select: { id: true, fullName: true, email: true },
      },
    },
    orderBy: { position: "asc" },
  });
}

/* ------------------------------------------------------------------ */
/*  Get waitlist position for an enrollment                            */
/* ------------------------------------------------------------------ */

export async function getWaitlistPosition(
  scheduleId: string,
  enrollmentId: string,
): Promise<number | null> {
  const entry = await prisma.waitlist.findUnique({
    where: { scheduleId_enrollmentId: { scheduleId, enrollmentId } },
    select: { position: true, status: true },
  });

  if (!entry || entry.status !== "WAITING") return null;
  return entry.position;
}

/* ------------------------------------------------------------------ */
/*  Promote next in line (when a seat opens up)                        */
/* ------------------------------------------------------------------ */

export async function promoteNextWaitlistEntry(
  scheduleId: string,
): Promise<WaitlistEntry | null> {
  const next = await prisma.waitlist.findFirst({
    where: { scheduleId, status: "WAITING" },
    orderBy: { position: "asc" },
    include: {
      enrollment: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  if (!next) return null;

  await prisma.waitlist.update({
    where: { id: next.id },
    data: { status: "PROMOTED" },
  });

  return { ...next, status: "PROMOTED" };
}

/* ------------------------------------------------------------------ */
/*  Cancel a waitlist entry                                            */
/* ------------------------------------------------------------------ */

export async function cancelWaitlistEntry(
  scheduleId: string,
  enrollmentId: string,
): Promise<Waitlist | null> {
  const entry = await prisma.waitlist.findUnique({
    where: { scheduleId_enrollmentId: { scheduleId, enrollmentId } },
  });

  if (!entry || entry.status !== "WAITING") return null;

  return prisma.waitlist.update({
    where: { id: entry.id },
    data: { status: "CANCELLED" },
  });
}

/* ------------------------------------------------------------------ */
/*  Count waiting entries for a schedule                               */
/* ------------------------------------------------------------------ */

export async function countWaitingEntries(scheduleId: string): Promise<number> {
  return prisma.waitlist.count({
    where: { scheduleId, status: "WAITING" },
  });
}
