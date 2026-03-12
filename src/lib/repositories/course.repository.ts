import { prisma } from "@/lib/prisma";
import type { Course, CourseSlug } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────

interface CreateCourseData {
  readonly slug: CourseSlug;
  readonly title: string;
  readonly description: string;
  readonly durationWeeks: number;
  readonly price: number;
  readonly currency?: string;
  readonly outcomes: ReadonlyArray<string>;
  readonly isActive?: boolean;
}

interface UpdateCourseData {
  readonly slug?: CourseSlug;
  readonly title?: string;
  readonly description?: string;
  readonly durationWeeks?: number;
  readonly price?: number;
  readonly currency?: string;
  readonly outcomes?: ReadonlyArray<string>;
  readonly isActive?: boolean;
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

export async function createCourse(data: CreateCourseData): Promise<Course> {
  return prisma.course.create({
    data: {
      slug: data.slug,
      title: data.title,
      description: data.description,
      durationWeeks: data.durationWeeks,
      price: data.price,
      currency: data.currency ?? "PHP",
      outcomes: [...data.outcomes],
      isActive: data.isActive ?? true,
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
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.outcomes !== undefined && { outcomes: [...data.outcomes] }),
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
