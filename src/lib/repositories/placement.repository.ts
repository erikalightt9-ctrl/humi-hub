import { prisma } from "@/lib/prisma";
import type { PlacementType } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CreatePlacementInput {
  readonly studentId: string;
  readonly jobApplicationId?: string;
  readonly companyName: string;
  readonly jobTitle: string;
  readonly employmentType: PlacementType;
  readonly monthlyRate?: number;
  readonly currency?: string;
  readonly startDate: Date;
  readonly notes?: string;
}

export interface UpdatePlacementInput {
  readonly companyName?: string;
  readonly jobTitle?: string;
  readonly employmentType?: PlacementType;
  readonly monthlyRate?: number | null;
  readonly currency?: string;
  readonly startDate?: Date;
  readonly notes?: string | null;
}

/* ------------------------------------------------------------------ */
/*  CRUD                                                               */
/* ------------------------------------------------------------------ */

export async function createPlacement(input: CreatePlacementInput) {
  return prisma.placement.create({
    data: {
      studentId: input.studentId,
      jobApplicationId: input.jobApplicationId ?? null,
      companyName: input.companyName,
      jobTitle: input.jobTitle,
      employmentType: input.employmentType,
      monthlyRate: input.monthlyRate ?? null,
      currency: input.currency ?? "USD",
      startDate: input.startDate,
      notes: input.notes ?? null,
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      jobApplication: { select: { id: true, jobPosting: { select: { title: true, company: true } } } },
    },
  });
}

export async function updatePlacement(id: string, input: UpdatePlacementInput) {
  return prisma.placement.update({
    where: { id },
    data: {
      ...(input.companyName !== undefined && { companyName: input.companyName }),
      ...(input.jobTitle !== undefined && { jobTitle: input.jobTitle }),
      ...(input.employmentType !== undefined && { employmentType: input.employmentType }),
      ...(input.monthlyRate !== undefined && { monthlyRate: input.monthlyRate }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function deletePlacement(id: string) {
  return prisma.placement.delete({ where: { id } });
}

export async function getPlacementById(id: string) {
  return prisma.placement.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          enrollment: { select: { courseId: true, course: { select: { title: true, slug: true } } } },
        },
      },
      jobApplication: {
        select: { id: true, jobPosting: { select: { title: true, company: true } } },
      },
    },
  });
}

export async function getPlacementByStudentId(studentId: string) {
  return prisma.placement.findUnique({
    where: { studentId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      jobApplication: { select: { id: true, jobPosting: { select: { title: true, company: true } } } },
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Admin list with filtering                                          */
/* ------------------------------------------------------------------ */

export interface PlacementListFilters {
  readonly courseSlug?: string;
  readonly employmentType?: PlacementType;
  readonly search?: string;
  readonly page?: number;
  readonly limit?: number;
}

export async function listPlacements(filters: PlacementListFilters = {}) {
  const { courseSlug, employmentType, search, page = 1, limit = 25 } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (employmentType) {
    where.employmentType = employmentType;
  }

  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { jobTitle: { contains: search, mode: "insensitive" } },
      { student: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (courseSlug) {
    where.student = {
      enrollment: { course: { slug: courseSlug } },
    };
  }

  const [items, total] = await Promise.all([
    prisma.placement.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            enrollment: { select: { course: { select: { title: true, slug: true } } } },
          },
        },
        jobApplication: {
          select: { id: true, jobPosting: { select: { title: true, company: true } } },
        },
      },
      orderBy: { placedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.placement.count({ where }),
  ]);

  return { items, total, page, limit };
}

/* ------------------------------------------------------------------ */
/*  Analytics                                                          */
/* ------------------------------------------------------------------ */

export async function getPlacementStats() {
  const [
    totalPlacements,
    byEmploymentType,
    byCourse,
    avgRate,
    recentPlacements,
    totalGraduates,
  ] = await Promise.all([
    prisma.placement.count(),

    prisma.placement.groupBy({
      by: ["employmentType"],
      _count: { _all: true },
      orderBy: { _count: { employmentType: "desc" } },
    }),

    prisma.placement.groupBy({
      by: ["studentId"],
      _count: { _all: true },
    }).then(async () => {
      // Group by course via student->enrollment->course
      const rows = await prisma.$queryRaw<
        Array<{ courseTitle: string; courseSlug: string; count: bigint }>
      >`
        SELECT
          c.title AS "courseTitle",
          c.slug  AS "courseSlug",
          COUNT(p.id)::bigint AS count
        FROM placements p
        JOIN students s ON s.id = p."studentId"
        JOIN enrollments e ON e.id = s."enrollmentId"
        JOIN courses c ON c.id = e."courseId"
        GROUP BY c.id, c.title, c.slug
        ORDER BY count DESC
      `;
      return rows.map((r) => ({ ...r, count: Number(r.count) }));
    }),

    prisma.placement.aggregate({
      _avg: { monthlyRate: true },
      where: { monthlyRate: { not: null } },
    }),

    prisma.placement.findMany({
      orderBy: { placedAt: "desc" },
      take: 5,
      select: {
        id: true,
        companyName: true,
        jobTitle: true,
        employmentType: true,
        monthlyRate: true,
        currency: true,
        placedAt: true,
        student: { select: { id: true, name: true } },
      },
    }),

    // Total students who have certificates (graduated)
    prisma.student.count({
      where: { certificates: { some: {} } },
    }),
  ]);

  const placementRate = totalGraduates > 0
    ? Math.round((totalPlacements / totalGraduates) * 100)
    : 0;

  return {
    totalPlacements,
    totalGraduates,
    placementRate,
    byEmploymentType: byEmploymentType.map((r) => ({
      type: r.employmentType,
      count: r._count._all,
    })),
    byCourse,
    avgMonthlyRate: avgRate._avg.monthlyRate
      ? Number(avgRate._avg.monthlyRate)
      : null,
    recentPlacements,
  };
}

/* ------------------------------------------------------------------ */
/*  Public stats (for student-success page)                            */
/* ------------------------------------------------------------------ */

export async function getPublicPlacementStats() {
  const [totalPlacements, totalGraduates, rateStats] = await Promise.all([
    prisma.placement.count(),

    prisma.student.count({ where: { certificates: { some: {} } } }),

    prisma.placement.aggregate({
      _avg: { monthlyRate: true },
      _min: { monthlyRate: true },
      _max: { monthlyRate: true },
      where: { monthlyRate: { not: null } },
    }),
  ]);

  const placementRate = totalGraduates > 0
    ? Math.round((totalPlacements / totalGraduates) * 100)
    : 0;

  return {
    totalPlacements,
    totalGraduates,
    placementRate,
    avgMonthlyRate: rateStats._avg.monthlyRate
      ? Number(rateStats._avg.monthlyRate)
      : null,
    minMonthlyRate: rateStats._min.monthlyRate
      ? Number(rateStats._min.monthlyRate)
      : null,
    maxMonthlyRate: rateStats._max.monthlyRate
      ? Number(rateStats._max.monthlyRate)
      : null,
  };
}
