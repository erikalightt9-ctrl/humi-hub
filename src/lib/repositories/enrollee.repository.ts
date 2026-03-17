import { prisma } from "@/lib/prisma";
import type { EnrolleeFilters, PaginatedResult } from "@/types";
import type { Prisma, Student, StudentPaymentStatus } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ScheduleSummary = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
} | null;

export type EnrolleeWithCourse = Student & {
  enrollment: {
    id: string;
    fullName: string;
    email: string;
    courseId: string;
    createdAt: Date;
    course: { id: string; slug: string; title: string; price: Decimal };
  };
  schedule: ScheduleSummary;
};

export type EnrolleeDetail = Student & {
  enrollment: {
    id: string;
    fullName: string;
    email: string;
    contactNumber: string;
    address: string;
    educationalBackground: string;
    workExperience: string;
    employmentStatus: string;
    technicalSkills: string[];
    whyEnroll: string;
    courseId: string;
    status: string;
    statusUpdatedAt: Date | null;
    statusUpdatedBy: string | null;
    referenceCode: string | null;
    paymentStatus: string;
    createdAt: Date;
    course: { id: string; slug: string; title: string; price: Decimal };
    payments: Array<{
      id: string;
      amount: Decimal;
      method: string;
      status: string;
      referenceNumber: string | null;
      notes: string | null;
      paidAt: Date | null;
      verifiedAt: Date | null;
      verifiedBy: string | null;
      proofFilePath: string | null;
      createdAt: Date;
    }>;
  };
  schedule: ScheduleSummary;
};

export interface EnrolleeStats {
  readonly total: number;
  readonly paid: number;
  readonly partial: number;
  readonly unpaid: number;
  readonly accessGranted: number;
}

export interface ActivityLogEntry {
  readonly id: string;
  readonly type: "lesson" | "quiz" | "submission" | "attendance";
  readonly title: string;
  readonly detail: string;
  readonly timestamp: Date;
}

/* ------------------------------------------------------------------ */
/*  List enrollees (paginated + filtered)                              */
/* ------------------------------------------------------------------ */

export async function listEnrollees(
  filters: EnrolleeFilters
): Promise<PaginatedResult<EnrolleeWithCourse>> {
  const { search, courseSlug, paymentStatus, accessGranted, batch, tenantId, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.StudentWhereInput = {};

  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (typeof accessGranted === "boolean") where.accessGranted = accessGranted;
  if (batch) where.batch = { contains: batch, mode: "insensitive" };

  if (courseSlug && tenantId) {
    where.enrollment = { course: { slug: courseSlug, tenantId } };
  } else if (courseSlug) {
    where.enrollment = { course: { slug: courseSlug } };
  } else if (tenantId) {
    where.enrollment = { course: { tenantId } };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        enrollment: {
          select: {
            id: true,
            fullName: true,
            email: true,
            courseId: true,
            createdAt: true,
            course: { select: { id: true, slug: true, title: true, price: true } },
          },
        },
        schedule: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            startTime: true,
            endTime: true,
            daysOfWeek: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.student.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/* ------------------------------------------------------------------ */
/*  Find single enrollee by ID                                         */
/* ------------------------------------------------------------------ */

export async function findEnrolleeById(id: string): Promise<EnrolleeDetail | null> {
  return prisma.student.findUnique({
    where: { id },
    include: {
      enrollment: {
        select: {
          id: true,
          fullName: true,
          email: true,
          contactNumber: true,
          address: true,
          educationalBackground: true,
          workExperience: true,
          employmentStatus: true,
          technicalSkills: true,
          whyEnroll: true,
          courseId: true,
          status: true,
          statusUpdatedAt: true,
          statusUpdatedBy: true,
          referenceCode: true,
          paymentStatus: true,
          createdAt: true,
          course: { select: { id: true, slug: true, title: true, price: true } },
          payments: {
            select: {
              id: true,
              amount: true,
              method: true,
              status: true,
              referenceNumber: true,
              notes: true,
              paidAt: true,
              verifiedAt: true,
              verifiedBy: true,
              proofFilePath: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      schedule: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          daysOfWeek: true,
        },
      },
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Payment update (auto-computes status)                              */
/* ------------------------------------------------------------------ */

function computePaymentStatus(amountPaid: number, coursePrice: number): StudentPaymentStatus {
  if (amountPaid >= coursePrice) return "PAID";
  if (amountPaid > 0) return "PARTIAL";
  return "UNPAID";
}

export async function updateEnrolleePayment(
  id: string,
  amountPaid: number,
  coursePrice: number
): Promise<Student> {
  const paymentStatus = computePaymentStatus(amountPaid, coursePrice);

  return prisma.student.update({
    where: { id },
    data: {
      amountPaid,
      paymentStatus,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Access control update                                              */
/* ------------------------------------------------------------------ */

export async function updateEnrolleeAccess(
  id: string,
  accessGranted: boolean,
  accessExpiry?: string | null
): Promise<Student> {
  return prisma.student.update({
    where: { id },
    data: {
      accessGranted,
      accessExpiry: accessExpiry ? new Date(accessExpiry) : null,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Notes update                                                       */
/* ------------------------------------------------------------------ */

export async function updateEnrolleeNotes(
  id: string,
  notes: string
): Promise<Student> {
  return prisma.student.update({
    where: { id },
    data: { notes },
  });
}

/* ------------------------------------------------------------------ */
/*  Batch update                                                       */
/* ------------------------------------------------------------------ */

export async function updateEnrolleeBatch(
  id: string,
  batch: string
): Promise<Student> {
  return prisma.student.update({
    where: { id },
    data: { batch },
  });
}

/* ------------------------------------------------------------------ */
/*  Schedule assignment                                                */
/* ------------------------------------------------------------------ */

export async function assignEnrolleeToSchedule(
  studentId: string,
  scheduleId: string | null
): Promise<Student> {
  if (scheduleId === null) {
    // Unassign from schedule
    return prisma.student.update({
      where: { id: studentId },
      data: { scheduleId: null, batch: null },
    });
  }

  // Verify schedule exists and has capacity
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { _count: { select: { students: true } } },
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  if (schedule.status !== "OPEN") {
    throw new Error("Schedule is not open for enrollment");
  }

  if (schedule._count.students >= schedule.maxCapacity) {
    throw new Error("Schedule is at full capacity");
  }

  // Assign student to schedule + set batch display name
  const updated = await prisma.student.update({
    where: { id: studentId },
    data: { scheduleId, batch: schedule.name },
  });

  // Check if schedule is now full and auto-update status
  const newCount = schedule._count.students + 1;
  if (newCount >= schedule.maxCapacity) {
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { status: "FULL" },
    });
  }

  return updated;
}

/* ------------------------------------------------------------------ */
/*  Stats for page header                                              */
/* ------------------------------------------------------------------ */

export async function getEnrolleeStats(tenantId?: string): Promise<EnrolleeStats> {
  const courseFilter = tenantId ? { enrollment: { course: { tenantId } } } : {};

  const [total, paid, partial, unpaid, access] = await Promise.all([
    prisma.student.count({ where: courseFilter }),
    prisma.student.count({ where: { ...courseFilter, paymentStatus: "PAID" } }),
    prisma.student.count({ where: { ...courseFilter, paymentStatus: "PARTIAL" } }),
    prisma.student.count({ where: { ...courseFilter, paymentStatus: "UNPAID" } }),
    prisma.student.count({ where: { ...courseFilter, accessGranted: true } }),
  ]);

  return { total, paid, partial, unpaid, accessGranted: access };
}

/* ------------------------------------------------------------------ */
/*  Activity log (recent actions by a student)                         */
/* ------------------------------------------------------------------ */

export async function getEnrolleeActivityLog(
  studentId: string,
  limit = 20
): Promise<ReadonlyArray<ActivityLogEntry>> {
  const [lessons, quizzes, submissions, attendance] = await Promise.all([
    prisma.lessonCompletion.findMany({
      where: { studentId },
      include: { lesson: { select: { title: true } } },
      orderBy: { completedAt: "desc" },
      take: limit,
    }),
    prisma.quizAttempt.findMany({
      where: { studentId },
      include: { quiz: { select: { title: true } } },
      orderBy: { completedAt: "desc" },
      take: limit,
    }),
    prisma.submission.findMany({
      where: { studentId },
      include: { assignment: { select: { title: true } } },
      orderBy: { submittedAt: "desc" },
      take: limit,
    }),
    prisma.attendanceRecord.findMany({
      where: { studentId },
      orderBy: { clockIn: "desc" },
      take: limit,
    }),
  ]);

  const entries: ActivityLogEntry[] = [
    ...lessons.map((l) => ({
      id: l.id,
      type: "lesson" as const,
      title: l.lesson.title,
      detail: "Completed lesson",
      timestamp: l.completedAt,
    })),
    ...quizzes.map((q) => ({
      id: q.id,
      type: "quiz" as const,
      title: q.quiz.title,
      detail: `Score: ${q.score}% — ${q.passed ? "Passed" : "Failed"}`,
      timestamp: q.completedAt,
    })),
    ...submissions.map((s) => ({
      id: s.id,
      type: "submission" as const,
      title: s.assignment.title,
      detail: `Status: ${s.status}${s.grade != null ? ` — Grade: ${s.grade}` : ""}`,
      timestamp: s.submittedAt,
    })),
    ...attendance.map((a) => ({
      id: a.id,
      type: "attendance" as const,
      title: "Clock In",
      detail: a.clockOut
        ? `Clocked out at ${a.clockOut.toLocaleTimeString("en-PH")}`
        : "Currently clocked in",
      timestamp: a.clockIn,
    })),
  ];

  // Sort all entries by timestamp desc, take the limit
  entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return entries.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/*  Delete a student (enrollee) and all related data                   */
/* ------------------------------------------------------------------ */

export async function deleteEnrollee(id: string): Promise<void> {
  await prisma.$transaction([
    prisma.attendanceRecord.deleteMany({ where: { studentId: id } }),
    prisma.lessonCompletion.deleteMany({ where: { studentId: id } }),
    prisma.quizAttempt.deleteMany({ where: { studentId: id } }),
    prisma.submission.deleteMany({ where: { studentId: id } }),
    prisma.certificate.deleteMany({ where: { studentId: id } }),
    prisma.forumPost.deleteMany({ where: { studentId: id } }),
    prisma.forumThread.deleteMany({ where: { studentId: id } }),
    prisma.subscription.deleteMany({ where: { studentId: id } }),
    prisma.student.delete({ where: { id } }),
  ]);
}
