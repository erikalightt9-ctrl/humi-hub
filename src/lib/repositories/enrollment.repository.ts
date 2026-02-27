import { prisma } from "@/lib/prisma";
import type { EnrollmentFormData } from "@/lib/validations/enrollment.schema";
import type { EnrollmentFilters, PaginatedResult } from "@/types";
import type { Enrollment, EnrollmentStatus, Prisma } from "@prisma/client";

export type EnrollmentWithCourse = Enrollment & {
  course: { id: string; slug: string; title: string };
};

export async function createEnrollment(
  data: EnrollmentFormData & { ipAddress?: string }
): Promise<Enrollment> {
  return prisma.enrollment.create({
    data: {
      fullName: data.fullName,
      dateOfBirth: new Date(data.dateOfBirth),
      email: data.email,
      contactNumber: data.contactNumber,
      address: data.address,
      educationalBackground: data.educationalBackground,
      workExperience: data.workExperience,
      employmentStatus: data.employmentStatus,
      technicalSkills: data.technicalSkills,
      toolsFamiliarity: data.toolsFamiliarity,
      whyEnroll: data.whyEnroll,
      courseId: data.courseId,
      ipAddress: data.ipAddress,
    },
  });
}

export async function findEnrollmentByEmail(email: string): Promise<Enrollment | null> {
  return prisma.enrollment.findUnique({ where: { email } });
}

export async function findEnrollmentById(id: string): Promise<EnrollmentWithCourse | null> {
  return prisma.enrollment.findUnique({
    where: { id },
    include: { course: { select: { id: true, slug: true, title: true } } },
  });
}

export async function listEnrollments(
  filters: EnrollmentFilters
): Promise<PaginatedResult<EnrollmentWithCourse>> {
  const { courseSlug, status, search, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.EnrollmentWhereInput = {};

  if (status) where.status = status;
  if (courseSlug) where.course = { slug: courseSlug };
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: { course: { select: { id: true, slug: true, title: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.enrollment.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateEnrollmentStatus(
  id: string,
  status: EnrollmentStatus,
  updatedBy: string
): Promise<Enrollment> {
  return prisma.enrollment.update({
    where: { id },
    data: {
      status,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: updatedBy,
    },
  });
}

export async function getAllEnrollmentsForExport(): Promise<EnrollmentWithCourse[]> {
  return prisma.enrollment.findMany({
    include: { course: { select: { id: true, slug: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function countRecentEnrollments(since: Date): Promise<number> {
  return prisma.enrollment.count({ where: { createdAt: { gte: since } } });
}
