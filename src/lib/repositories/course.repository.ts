import { prisma } from "@/lib/prisma";
import type { Course } from "@prisma/client";
import { scopeToTenant } from "@/lib/tenant-isolation";

// ── Types ──────────────────────────────────────────────────────────

interface CreateCourseData {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly durationWeeks: number;
  readonly price: number;
  readonly priceBasic?: number;
  readonly priceProfessional?: number;
  readonly priceAdvanced?: number;
  readonly currency?: string;
  readonly outcomes: ReadonlyArray<string>;
  readonly featuresBasic?: ReadonlyArray<string>;
  readonly featuresProfessional?: ReadonlyArray<string>;
  readonly featuresAdvanced?: ReadonlyArray<string>;
  readonly popularTier?: string | null;
  readonly industry?: string;
  readonly isActive?: boolean;
}

interface UpdateCourseData {
  readonly slug?: string;
  readonly title?: string;
  readonly description?: string;
  readonly durationWeeks?: number;
  readonly price?: number;
  readonly priceBasic?: number;
  readonly priceProfessional?: number;
  readonly priceAdvanced?: number;
  readonly currency?: string;
  readonly outcomes?: ReadonlyArray<string>;
  readonly featuresBasic?: ReadonlyArray<string>;
  readonly featuresProfessional?: ReadonlyArray<string>;
  readonly featuresAdvanced?: ReadonlyArray<string>;
  readonly popularTier?: string | null;
  readonly industry?: string;
  readonly isActive?: boolean;
}

export interface CourseTierPricing {
  readonly basic: number;
  readonly professional: number;
  readonly advanced: number;
}

// ── Return types ──────────────────────────────────────────────────

interface CourseWithCounts extends Course {
  readonly _count: {
    readonly enrollments: number;
    readonly lessons: number;
    readonly quizzes: number;
    readonly assignments: number;
    readonly trainers: number;
    readonly resources: number;
  };
}

// ── Admin: List all courses with counts ───────────────────────────

export async function getAllCourses(): Promise<ReadonlyArray<CourseWithCounts>> {
  return prisma.course.findMany({
    include: {
      _count: {
        select: {
          enrollments: true,
          lessons: true,
          quizzes: true,
          assignments: true,
          trainers: true,
          resources: true,
        },
      },
    },
    orderBy: { title: "asc" },
  });
}

export async function getAllCoursesByTenant(
  tenantId: string,
): Promise<ReadonlyArray<CourseWithCounts>> {
  return prisma.course.findMany({
    where: scopeToTenant(tenantId),
    include: {
      _count: {
        select: {
          enrollments: true,
          lessons: true,
          quizzes: true,
          assignments: true,
          trainers: true,
          resources: true,
        },
      },
    },
    orderBy: { title: "asc" },
  });
}

// ── Admin: Get single course with full details ────────────────────

export async function getCourseById(id: string) {
  return prisma.course.findUnique({
    where: { id },
    include: {
      lessons: {
        orderBy: { order: "asc" },
      },
      trainers: {
        include: { trainer: true },
      },
      resources: true,
      _count: {
        select: {
          enrollments: true,
          lessons: true,
          quizzes: true,
          assignments: true,
          trainers: true,
          resources: true,
        },
      },
    },
  });
}

// ── Admin: Create course ──────────────────────────────────────────

export async function createCourse(
  data: CreateCourseData & { tenantId?: string },
): Promise<Course> {
  return prisma.course.create({
    data: {
      slug: data.slug,
      title: data.title,
      description: data.description,
      durationWeeks: data.durationWeeks,
      price: data.price,
      priceBasic: data.priceBasic ?? data.price,
      priceProfessional: data.priceProfessional ?? 3500,
      priceAdvanced: data.priceAdvanced ?? 5500,
      currency: data.currency ?? "PHP",
      outcomes: [...data.outcomes],
      ...(data.featuresBasic && { featuresBasic: [...data.featuresBasic] }),
      ...(data.featuresProfessional && { featuresProfessional: [...data.featuresProfessional] }),
      ...(data.featuresAdvanced && { featuresAdvanced: [...data.featuresAdvanced] }),
      ...(data.popularTier !== undefined && { popularTier: data.popularTier }),
      ...(data.industry !== undefined && { industry: data.industry }),
      isActive: data.isActive ?? true,
      ...(data.tenantId && { tenantId: data.tenantId }),
    },
  });
}

// ── Admin: Update course ──────────────────────────────────────────

export async function updateCourse(
  id: string,
  data: UpdateCourseData,
): Promise<Course> {
  return prisma.course.update({
    where: { id },
    data: {
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.durationWeeks !== undefined && {
        durationWeeks: data.durationWeeks,
      }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.priceBasic !== undefined && { priceBasic: data.priceBasic }),
      ...(data.priceProfessional !== undefined && { priceProfessional: data.priceProfessional }),
      ...(data.priceAdvanced !== undefined && { priceAdvanced: data.priceAdvanced }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.outcomes !== undefined && { outcomes: [...data.outcomes] }),
      ...(data.featuresBasic !== undefined && { featuresBasic: [...data.featuresBasic] }),
      ...(data.featuresProfessional !== undefined && { featuresProfessional: [...data.featuresProfessional] }),
      ...(data.featuresAdvanced !== undefined && { featuresAdvanced: [...data.featuresAdvanced] }),
      ...(data.popularTier !== undefined && { popularTier: data.popularTier }),
      ...(data.industry !== undefined && { industry: data.industry }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

// ── Admin: Soft-delete course (set isActive=false) ────────────────

export async function deleteCourse(id: string): Promise<Course> {
  return prisma.course.update({
    where: { id },
    data: { isActive: false },
  });
}

// ── Get tier pricing for a course ──────────────────────────────────

export async function getCourseTierPricing(
  courseId: string,
): Promise<CourseTierPricing | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      priceBasic: true,
      priceProfessional: true,
      priceAdvanced: true,
    },
  });
  if (!course) return null;
  return {
    basic: Number(course.priceBasic),
    professional: Number(course.priceProfessional),
    advanced: Number(course.priceAdvanced),
  };
}
