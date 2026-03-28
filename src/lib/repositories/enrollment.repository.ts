import { prisma } from "@/lib/prisma";
import type { EnrollmentFormData } from "@/lib/validations/enrollment.schema";
import type { EnrollmentFilters, PaginatedResult } from "@/types";
import { scopeViaCourse, type TenantScope } from "@/lib/tenant-isolation";
import type { Decimal } from "@prisma/client/runtime/client";
import type {
  Enrollment,
  EnrollmentStatus,
  EmploymentStatus as PrismaEmploymentStatus,
  ToolFamiliarity as PrismaToolFamiliarity,
  CourseTier,
  TrainerTier,
  Prisma,
} from "@prisma/client";

export type EnrollmentWithCourse = Enrollment & {
  course: { id: string; slug: string; title: string; price: Decimal; tenantId: string | null };
};

interface CreateEnrollmentInput {
  readonly fullName: string;
  readonly dateOfBirth: string;
  readonly email: string;
  readonly contactNumber: string;
  readonly address: string;
  readonly educationalBackground: string;
  readonly workExperience: string;
  readonly employmentStatus: PrismaEmploymentStatus;
  readonly technicalSkills: ReadonlyArray<string>;
  readonly toolsFamiliarity: ReadonlyArray<PrismaToolFamiliarity>;
  readonly whyEnroll: string;
  readonly courseId: string;
  readonly courseTier?: CourseTier;
  readonly ipAddress?: string;
  readonly trainerId?: string | null;
  readonly baseProgramPrice?: number | null;
  readonly trainerTier?: TrainerTier | null;
  readonly trainerUpgradeFee?: number | null;
  readonly scheduleId?: string | null;
}

export async function createEnrollment(
  data: CreateEnrollmentInput,
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
      technicalSkills: [...data.technicalSkills],
      toolsFamiliarity: [...data.toolsFamiliarity],
      whyEnroll: data.whyEnroll,
      courseId: data.courseId,
      courseTier: data.courseTier ?? "BASIC",
      ipAddress: data.ipAddress,
      trainerId: data.trainerId ?? null,
      baseProgramPrice: data.baseProgramPrice ?? null,
      trainerTier: data.trainerTier ?? null,
      trainerUpgradeFee: data.trainerUpgradeFee ?? null,
      scheduleId: data.scheduleId ?? null,
    },
  });
}

export async function countEnrollmentsByEmail(email: string): Promise<number> {
  return prisma.enrollment.count({
    where: { email: { equals: email, mode: "insensitive" } },
  });
}

export async function findEnrollmentById(id: string): Promise<EnrollmentWithCourse | null> {
  return prisma.enrollment.findUnique({
    where: { id },
    include: { course: { select: { id: true, slug: true, title: true, price: true, tenantId: true } } },
  });
}

export async function listEnrollments(
  filters: EnrollmentFilters
): Promise<PaginatedResult<EnrollmentWithCourse>> {
  const { courseSlug, status, search, tenantId, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.EnrollmentWhereInput = {};

  if (status) where.status = status;
  if (courseSlug && tenantId) {
    where.course = { slug: courseSlug, tenantId };
  } else if (courseSlug) {
    where.course = { slug: courseSlug };
  } else if (tenantId) {
    where.course = { tenantId };
  }
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: { course: { select: { id: true, slug: true, title: true, price: true, tenantId: true } } },
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

export async function getAllEnrollmentsForExport(scope: TenantScope = null): Promise<EnrollmentWithCourse[]> {
  return prisma.enrollment.findMany({
    where: scopeViaCourse(scope),
    include: { course: { select: { id: true, slug: true, title: true, price: true, tenantId: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function countRecentEnrollments(since: Date): Promise<number> {
  return prisma.enrollment.count({ where: { createdAt: { gte: since } } });
}

/** Update editable fields on an enrollment application */
export async function updateEnrollmentFields(
  id: string,
  data: {
    readonly fullName?: string;
    readonly email?: string;
    readonly contactNumber?: string;
    readonly address?: string;
    readonly courseId?: string;
  },
): Promise<Enrollment> {
  return prisma.enrollment.update({
    where: { id },
    data,
  });
}

/** Delete an enrollment application (hard delete).
 *  If the enrollment is ENROLLED, also cascade-deletes the student and all related data. */
export async function deleteEnrollment(id: string): Promise<void> {
  // Check if a student record exists for this enrollment
  const student = await prisma.student.findUnique({
    where: { enrollmentId: id },
    select: { id: true },
  });

  const operations: Prisma.PrismaPromise<unknown>[] = [];

  // If enrolled, cascade-delete all student-related data first
  if (student) {
    operations.push(
      prisma.attendanceRecord.deleteMany({ where: { studentId: student.id } }),
      prisma.lessonCompletion.deleteMany({ where: { studentId: student.id } }),
      prisma.quizAttempt.deleteMany({ where: { studentId: student.id } }),
      prisma.submission.deleteMany({ where: { studentId: student.id } }),
      prisma.certificate.deleteMany({ where: { studentId: student.id } }),
      prisma.forumPost.deleteMany({ where: { studentId: student.id } }),
      prisma.forumThread.deleteMany({ where: { studentId: student.id } }),
      prisma.subscription.deleteMany({ where: { studentId: student.id } }),
      prisma.student.delete({ where: { id: student.id } }),
    );
  }

  // Delete payments and enrollment
  operations.push(
    prisma.payment.deleteMany({ where: { enrollmentId: id } }),
    prisma.enrollment.delete({ where: { id } }),
  );

  await prisma.$transaction(operations);
}
