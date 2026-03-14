import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CreateOrganizationInput {
  readonly name: string;
  readonly slug: string;
  readonly email: string;
  readonly industry?: string | null;
  readonly maxSeats?: number;
}

interface UpdateOrganizationInput {
  readonly name?: string;
  readonly industry?: string | null;
  readonly logoUrl?: string | null;
  readonly maxSeats?: number;
  readonly isActive?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Read                                                               */
/* ------------------------------------------------------------------ */

export async function getAllOrganizations() {
  return prisma.organization.findMany({
    include: {
      _count: { select: { managers: true, students: true, enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrganizationById(id: string) {
  return prisma.organization.findUnique({
    where: { id },
    include: {
      managers: {
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      },
      _count: { select: { students: true, enrollments: true } },
    },
  });
}

export async function getOrganizationBySlug(slug: string) {
  return prisma.organization.findUnique({
    where: { slug },
  });
}

/* ------------------------------------------------------------------ */
/*  Write                                                              */
/* ------------------------------------------------------------------ */

export async function createOrganization(data: CreateOrganizationInput) {
  return prisma.organization.create({
    data: {
      name: data.name,
      slug: data.slug,
      email: data.email,
      industry: data.industry ?? null,
      maxSeats: data.maxSeats ?? 10,
    },
  });
}

export async function updateOrganization(id: string, data: UpdateOrganizationInput) {
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.industry !== undefined) updateData.industry = data.industry;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
  if (data.maxSeats !== undefined) updateData.maxSeats = data.maxSeats;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return prisma.organization.update({
    where: { id },
    data: updateData,
  });
}

/* ------------------------------------------------------------------ */
/*  Corporate dashboard stats (scoped to org)                          */
/* ------------------------------------------------------------------ */

export async function getOrganizationDashboardStats(organizationId: string) {
  const [org, studentCount, enrollmentStats, completedCerts] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, maxSeats: true, industry: true, logoUrl: true },
    }),
    prisma.student.count({ where: { organizationId } }),
    prisma.enrollment.findMany({
      where: { organizationId },
      select: {
        id: true,
        status: true,
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
        courseTier: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.certificate.count({
      where: { student: { organizationId } },
    }),
  ]);

  const activeEnrollments = enrollmentStats.filter(
    (e) => e.status === "APPROVED" || e.status === "ENROLLED",
  ).length;

  return {
    organizationName: org?.name ?? "Organization",
    maxSeats: org?.maxSeats ?? 10,
    industry: org?.industry ?? null,
    logoUrl: org?.logoUrl ?? null,
    totalEmployees: studentCount,
    activeEnrollments,
    totalEnrollments: enrollmentStats.length,
    certificatesEarned: completedCerts,
    recentEnrollments: enrollmentStats.slice(0, 10),
  };
}

/* ------------------------------------------------------------------ */
/*  Employees (students in org)                                        */
/* ------------------------------------------------------------------ */

export async function getOrganizationEmployees(organizationId: string) {
  return prisma.student.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      enrollment: {
        select: {
          id: true,
          status: true,
          courseTier: true,
          course: { select: { id: true, title: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/* ------------------------------------------------------------------ */
/*  Analytics                                                          */
/* ------------------------------------------------------------------ */

export async function getOrganizationAnalytics(organizationId: string) {
  const students = await prisma.student.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      enrollment: {
        select: {
          course: { select: { title: true, slug: true } },
          courseTier: true,
        },
      },
    },
  });

  const studentIds = students.map((s) => s.id);

  if (studentIds.length === 0) {
    return {
      totalEmployees: 0,
      courseBreakdown: [],
      avgQuizScore: 0,
      avgAssignmentScore: 0,
      totalCertificates: 0,
    };
  }

  const [quizAgg, assignmentAgg, certCount] = await Promise.all([
    prisma.quizAttempt.aggregate({
      where: { studentId: { in: studentIds } },
      _avg: { score: true },
    }),
    prisma.submission.aggregate({
      where: { studentId: { in: studentIds }, status: "GRADED" },
      _avg: { grade: true },
    }),
    prisma.certificate.count({
      where: { studentId: { in: studentIds } },
    }),
  ]);

  // Group by course
  const courseMap = new Map<string, number>();
  for (const student of students) {
    const courseTitle = student.enrollment?.course.title ?? "Unknown";
    courseMap.set(courseTitle, (courseMap.get(courseTitle) ?? 0) + 1);
  }

  const courseBreakdown = Array.from(courseMap.entries()).map(([course, count]) => ({
    course,
    count,
  }));

  return {
    totalEmployees: students.length,
    courseBreakdown,
    avgQuizScore: Math.round(quizAgg._avg.score ?? 0),
    avgAssignmentScore: Math.round(assignmentAgg._avg.grade ?? 0),
    totalCertificates: certCount,
  };
}
