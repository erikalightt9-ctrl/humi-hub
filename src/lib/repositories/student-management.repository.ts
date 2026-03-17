import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ActiveStudentRow {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly courseTitle: string;
  readonly courseId: string;
  readonly enrolledAt: string;
  readonly progressPercent: number;
  readonly quizAverage: number;
  readonly assignmentsSubmitted: number;
  readonly totalPoints: number;
  readonly lastActive: string | null;
  readonly isClockedIn: boolean;
}

export interface ActiveStudentFilters {
  search?: string;
  courseId?: string;
  tenantId?: string;
  page?: number;
  limit?: number;
}

export interface StudentDetail {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly createdAt: string;
  readonly course: { readonly id: string; readonly title: string; readonly slug: string };
  readonly enrollment: {
    readonly fullName: string;
    readonly contactNumber: string;
    readonly address: string;
    readonly educationalBackground: string;
    readonly workExperience: string;
    readonly employmentStatus: string;
    readonly dateOfBirth: string;
  };
  readonly progress: { readonly completed: number; readonly total: number; readonly percent: number };
  readonly quizAverage: number;
  readonly assignmentsSubmitted: number;
  readonly totalAssignments: number;
  readonly totalPoints: number;
  readonly recentAttendance: ReadonlyArray<{
    readonly id: string;
    readonly clockIn: string;
    readonly clockOut: string | null;
  }>;
  readonly quizResults: ReadonlyArray<{
    readonly quizTitle: string;
    readonly score: number;
    readonly passed: boolean;
    readonly completedAt: string;
  }>;
  readonly assignmentGrades: ReadonlyArray<{
    readonly assignmentTitle: string;
    readonly grade: number | null;
    readonly status: string;
    readonly submittedAt: string;
  }>;
  readonly badges: ReadonlyArray<{
    readonly name: string;
    readonly icon: string;
    readonly earnedAt: string;
  }>;
}

/* ------------------------------------------------------------------ */
/*  List Active Students                                               */
/* ------------------------------------------------------------------ */

export async function listActiveStudents(filters: ActiveStudentFilters = {}) {
  const { search, courseId, tenantId, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (courseId && tenantId) {
    where.enrollment = { courseId, course: { tenantId } };
  } else if (courseId) {
    where.enrollment = { courseId };
  } else if (tenantId) {
    where.enrollment = { course: { tenantId } };
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        enrollment: {
          include: { course: { select: { id: true, title: true } } },
        },
        completions: { select: { id: true } },
        attempts: {
          select: { score: true },
          orderBy: { completedAt: "desc" },
        },
        submissions: { select: { id: true } },
        points: { select: { points: true } },
        attendance: {
          where: { clockOut: null },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.student.count({ where }),
  ]);

  // Get total lessons per course for progress calculation
  const courseIds = [...new Set(students.map((s) => s.enrollment.courseId))];
  const lessonCounts = await prisma.lesson.groupBy({
    by: ["courseId"],
    where: { courseId: { in: courseIds }, isPublished: true },
    _count: { id: true },
  });
  const lessonCountMap = new Map(
    lessonCounts.map((lc) => [lc.courseId, lc._count.id]),
  );

  // Get last activity for each student
  const studentIds = students.map((s) => s.id);
  const lastCompletions = await prisma.lessonCompletion.findMany({
    where: { studentId: { in: studentIds } },
    select: { studentId: true, completedAt: true },
    orderBy: { completedAt: "desc" },
    distinct: ["studentId"],
  });
  const lastAttempts = await prisma.quizAttempt.findMany({
    where: { studentId: { in: studentIds } },
    select: { studentId: true, completedAt: true },
    orderBy: { completedAt: "desc" },
    distinct: ["studentId"],
  });
  const lastSubmissions = await prisma.submission.findMany({
    where: { studentId: { in: studentIds } },
    select: { studentId: true, submittedAt: true },
    orderBy: { submittedAt: "desc" },
    distinct: ["studentId"],
  });

  function getLastActive(studentId: string): Date | null {
    const dates: Date[] = [];
    const lc = lastCompletions.find((c) => c.studentId === studentId);
    if (lc) dates.push(lc.completedAt);
    const la = lastAttempts.find((a) => a.studentId === studentId);
    if (la) dates.push(la.completedAt);
    const ls = lastSubmissions.find((s) => s.studentId === studentId);
    if (ls) dates.push(ls.submittedAt);
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates.map((d) => d.getTime())));
  }

  const rows: ActiveStudentRow[] = students.map((s) => {
    const totalLessons = lessonCountMap.get(s.enrollment.courseId) ?? 0;
    const completedLessons = s.completions.length;
    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const quizScores = s.attempts.map((a) => a.score);
    const quizAverage =
      quizScores.length > 0
        ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
        : 0;

    const totalPoints = s.points.reduce((sum, p) => sum + p.points, 0);
    const lastActive = getLastActive(s.id);

    return {
      id: s.id,
      name: s.name,
      email: s.email,
      courseTitle: s.enrollment.course.title,
      courseId: s.enrollment.courseId,
      enrolledAt: s.createdAt.toISOString(),
      progressPercent,
      quizAverage,
      assignmentsSubmitted: s.submissions.length,
      totalPoints,
      lastActive: lastActive?.toISOString() ?? null,
      isClockedIn: s.attendance.length > 0,
    };
  });

  return {
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/* ------------------------------------------------------------------ */
/*  Student Detail                                                     */
/* ------------------------------------------------------------------ */

export async function getStudentDetail(
  studentId: string,
): Promise<StudentDetail | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      enrollment: {
        include: { course: { select: { id: true, title: true, slug: true } } },
      },
    },
  });

  if (!student) return null;

  const courseId = student.enrollment.courseId;

  const [
    totalLessons,
    completedLessons,
    quizAttempts,
    submissions,
    totalAssignments,
    pointsSum,
    recentAttendance,
    badges,
  ] = await Promise.all([
    prisma.lesson.count({ where: { courseId, isPublished: true } }),
    prisma.lessonCompletion.count({ where: { studentId } }),
    prisma.quizAttempt.findMany({
      where: { studentId },
      include: { quiz: { select: { title: true } } },
      orderBy: { completedAt: "desc" },
      take: 20,
    }),
    prisma.submission.findMany({
      where: { studentId },
      include: { assignment: { select: { title: true } } },
      orderBy: { submittedAt: "desc" },
      take: 20,
    }),
    prisma.assignment.count({ where: { courseId, isPublished: true } }),
    prisma.pointTransaction.aggregate({
      where: { studentId },
      _sum: { points: true },
    }),
    prisma.attendanceRecord.findMany({
      where: { studentId },
      orderBy: { clockIn: "desc" },
      take: 10,
    }),
    prisma.studentBadge.findMany({
      where: { studentId },
      include: { badge: { select: { name: true, icon: true } } },
      orderBy: { earnedAt: "desc" },
    }),
  ]);

  const progressPercent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const quizScores = quizAttempts.map((a) => a.score);
  const quizAverage =
    quizScores.length > 0
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : 0;

  return {
    id: student.id,
    name: student.name,
    email: student.email,
    createdAt: student.createdAt.toISOString(),
    course: {
      id: student.enrollment.course.id,
      title: student.enrollment.course.title,
      slug: student.enrollment.course.slug,
    },
    enrollment: {
      fullName: student.enrollment.fullName,
      contactNumber: student.enrollment.contactNumber,
      address: student.enrollment.address,
      educationalBackground: student.enrollment.educationalBackground,
      workExperience: student.enrollment.workExperience,
      employmentStatus: student.enrollment.employmentStatus,
      dateOfBirth: student.enrollment.dateOfBirth.toISOString(),
    },
    progress: {
      completed: completedLessons,
      total: totalLessons,
      percent: progressPercent,
    },
    quizAverage,
    assignmentsSubmitted: submissions.length,
    totalAssignments,
    totalPoints: pointsSum._sum.points ?? 0,
    recentAttendance: recentAttendance.map((a) => ({
      id: a.id,
      clockIn: a.clockIn.toISOString(),
      clockOut: a.clockOut?.toISOString() ?? null,
    })),
    quizResults: quizAttempts.map((a) => ({
      quizTitle: a.quiz.title,
      score: a.score,
      passed: a.passed,
      completedAt: a.completedAt.toISOString(),
    })),
    assignmentGrades: submissions.map((s) => ({
      assignmentTitle: s.assignment.title,
      grade: s.grade,
      status: s.status,
      submittedAt: s.submittedAt.toISOString(),
    })),
    badges: badges.map((b) => ({
      name: b.badge.name,
      icon: b.badge.icon,
      earnedAt: b.earnedAt.toISOString(),
    })),
  };
}
