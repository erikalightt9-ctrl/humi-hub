import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Write — compute from live tables and upsert                       */
/* ------------------------------------------------------------------ */

/**
 * Computes a daily usage snapshot for a single course and upserts it.
 * Safe to call repeatedly for the same (courseId, date).
 */
export async function upsertCourseUsageSnapshot(
  courseId: string,
  tenantId: string | null,
  date: Date
) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const thirtyDaysAgo = new Date(dayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalEnrolled,
    activeStudents,
    completions,
    progressAgg,
    lessonViews,
  ] = await Promise.all([
    // Total students enrolled in this course
    prisma.enrollment.count({
      where: { courseId, status: { in: ["APPROVED", "ENROLLED"] } },
    }),

    // Students who interacted with this course in the last 30 days
    prisma.courseProgress.count({
      where: { courseId, lastActiveAt: { gte: thirtyDaysAgo } },
    }),

    // Students who finished the course
    prisma.courseProgress.count({
      where: { courseId, percentComplete: 100 },
    }),

    // Average progress across all enrolled students
    prisma.courseProgress.aggregate({
      where: { courseId },
      _avg: { percentComplete: true },
    }),

    // Lesson completions recorded on this day
    prisma.lessonCompletion.count({
      where: {
        lesson: { courseId },
        completedAt: { gte: dayStart, lte: dayEnd },
      },
    }),
  ]);

  const avgProgress = Math.round(progressAgg._avg.percentComplete ?? 0);

  return prisma.courseUsageSnapshot.upsert({
    where: { courseId_snapshotDate: { courseId, snapshotDate: dayStart } },
    create: {
      courseId,
      tenantId,
      snapshotDate: dayStart,
      totalEnrolled,
      activeStudents,
      completions,
      avgProgress,
      lessonViews,
    },
    update: {
      totalEnrolled,
      activeStudents,
      completions,
      avgProgress,
      lessonViews,
    },
  });
}

/**
 * Snapshot all active courses for a tenant (or all tenants if tenantId is null).
 * Intended for a daily cron job.
 */
export async function snapshotAllCourses(tenantId: string | null = null) {
  const today = new Date();

  const courses = await prisma.course.findMany({
    where: {
      isActive: true,
      ...(tenantId ? { tenantId } : {}),
    },
    select: { id: true, tenantId: true },
  });

  const results = await Promise.allSettled(
    courses.map((c) => upsertCourseUsageSnapshot(c.id, c.tenantId, today))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return { succeeded, failed, total: courses.length };
}

/* ------------------------------------------------------------------ */
/*  Read                                                               */
/* ------------------------------------------------------------------ */

/**
 * Returns daily snapshots for a course over the last N days (default 30).
 */
export async function getCourseUsageHistory(courseId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.courseUsageSnapshot.findMany({
    where: { courseId, snapshotDate: { gte: since } },
    orderBy: { snapshotDate: "asc" },
  });
}

/**
 * Returns the most recent snapshot for each active course under a tenant.
 * Used for the admin analytics dashboard table.
 */
export async function getLatestSnapshotsForTenant(tenantId: string | null) {
  const courses = await prisma.course.findMany({
    where: {
      isActive: true,
      ...(tenantId ? { tenantId } : {}),
    },
    select: {
      id: true,
      title: true,
      usageSnapshots: {
        orderBy: { snapshotDate: "desc" },
        take: 1,
      },
    },
  });

  return courses.map((c) => ({
    courseId: c.id,
    title: c.title,
    latest: c.usageSnapshots[0] ?? null,
  }));
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
