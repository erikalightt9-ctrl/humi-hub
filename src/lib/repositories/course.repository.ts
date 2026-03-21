import { Prisma } from "@prisma/client";
import type { Course, CoursePriceHistory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scopeToTenant } from "@/lib/tenant-isolation";
import { type DiscountConfig, computeFinalPrice, parseDiscount } from "@/lib/types/discount";

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
  readonly discountBasic?: DiscountConfig | null;
  readonly discountProfessional?: DiscountConfig | null;
  readonly discountAdvanced?: DiscountConfig | null;
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
  readonly discountBasic?: DiscountConfig | null;
  readonly discountProfessional?: DiscountConfig | null;
  readonly discountAdvanced?: DiscountConfig | null;
}

export interface CourseTierPricing {
  readonly basic: number;
  readonly professional: number;
  readonly advanced: number;
}

// Re-export DiscountConfig for consumers
export type { DiscountConfig };

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

// ── Helpers ──────────────────────────────────────────────────────

/** Safely cast a DiscountConfig to Prisma's InputJsonValue. */
function toInputJson(d: DiscountConfig | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (d === null || d === undefined) return Prisma.JsonNull;
  return d as unknown as Prisma.InputJsonValue;
}

/** Build the update data payload for prisma.course.update. */
function buildCourseUpdatePayload(data: UpdateCourseData): Prisma.CourseUpdateInput {
  return {
    ...(data.slug !== undefined && { slug: data.slug }),
    ...(data.title !== undefined && { title: data.title }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.durationWeeks !== undefined && { durationWeeks: data.durationWeeks }),
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
    ...("discountBasic" in data && { discountBasic: toInputJson(data.discountBasic) }),
    ...("discountProfessional" in data && { discountProfessional: toInputJson(data.discountProfessional) }),
    ...("discountAdvanced" in data && { discountAdvanced: toInputJson(data.discountAdvanced) }),
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
      // All tier prices fall back to the base price so every new course
      // starts with consistent pricing rather than stale hardcoded defaults.
      priceBasic: data.priceBasic ?? data.price,
      priceProfessional: data.priceProfessional ?? data.price,
      priceAdvanced: data.priceAdvanced ?? data.price,
      currency: data.currency ?? "PHP",
      outcomes: [...data.outcomes],
      ...(data.featuresBasic && { featuresBasic: [...data.featuresBasic] }),
      ...(data.featuresProfessional && { featuresProfessional: [...data.featuresProfessional] }),
      ...(data.featuresAdvanced && { featuresAdvanced: [...data.featuresAdvanced] }),
      ...(data.popularTier !== undefined && { popularTier: data.popularTier }),
      ...(data.industry !== undefined && { industry: data.industry }),
      isActive: data.isActive ?? true,
      ...(data.tenantId && { tenantId: data.tenantId }),
      ...("discountBasic" in data && { discountBasic: toInputJson(data.discountBasic) }),
      ...("discountProfessional" in data && { discountProfessional: toInputJson(data.discountProfessional) }),
      ...("discountAdvanced" in data && { discountAdvanced: toInputJson(data.discountAdvanced) }),
    },
  });
}

// ── Admin: Update course (with price-history tracking) ────────────

export async function updateCourse(
  id: string,
  data: UpdateCourseData,
): Promise<Course> {
  const updatePayload = buildCourseUpdatePayload(data);
  const tierPricesChanging =
    data.priceBasic !== undefined ||
    data.priceProfessional !== undefined ||
    data.priceAdvanced !== undefined;

  if (!tierPricesChanging) {
    return prisma.course.update({ where: { id }, data: updatePayload });
  }

  // Read current prices before we overwrite them
  const current = await prisma.course.findUnique({
    where: { id },
    select: { priceBasic: true, priceProfessional: true, priceAdvanced: true },
  });

  if (!current) {
    return prisma.course.update({ where: { id }, data: updatePayload });
  }

  // Detect which tiers actually changed
  const historyRows: Array<{
    courseId: string;
    tier: string;
    oldPrice: number;
    newPrice: number;
  }> = [];

  const checks: ReadonlyArray<{
    key: "priceBasic" | "priceProfessional" | "priceAdvanced";
    tier: string;
  }> = [
    { key: "priceBasic", tier: "BASIC" },
    { key: "priceProfessional", tier: "PROFESSIONAL" },
    { key: "priceAdvanced", tier: "ADVANCED" },
  ];

  for (const { key, tier } of checks) {
    const newVal = data[key];
    if (newVal === undefined) continue;
    const oldVal = Number(current[key]);
    if (oldVal !== newVal) {
      historyRows.push({ courseId: id, tier, oldPrice: oldVal, newPrice: newVal });
    }
  }

  if (historyRows.length === 0) {
    return prisma.course.update({ where: { id }, data: updatePayload });
  }

  // Atomic transaction: course update + price history written together.
  // If either fails, both are rolled back.
  const [updated] = await prisma.$transaction([
    prisma.course.update({ where: { id }, data: updatePayload }),
    prisma.coursePriceHistory.createMany({ data: historyRows }),
  ]);

  return updated;
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

// ── Get price history for a course ───────────────────────────────

export async function getCoursePriceHistory(
  courseId: string,
  limit = 50,
): Promise<ReadonlyArray<CoursePriceHistory>> {
  return prisma.coursePriceHistory.findMany({
    where: { courseId },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

// ── Parse discount from Prisma Json field (re-export from shared types) ──

export { parseDiscount };

// ── Compute final tier prices applying discounts ─────────────────

export function computeTierFinalPrices(course: {
  priceBasic: { toString(): string };
  priceProfessional: { toString(): string };
  priceAdvanced: { toString(): string };
  discountBasic: unknown;
  discountProfessional: unknown;
  discountAdvanced: unknown;
}) {
  const basic = Number(course.priceBasic);
  const professional = Number(course.priceProfessional);
  const advanced = Number(course.priceAdvanced);

  const dBasic = parseDiscount(course.discountBasic);
  const dPro = parseDiscount(course.discountProfessional);
  const dAdv = parseDiscount(course.discountAdvanced);

  return {
    priceBasic: basic,
    priceProfessional: professional,
    priceAdvanced: advanced,
    finalPriceBasic: computeFinalPrice(basic, dBasic),
    finalPriceProfessional: computeFinalPrice(professional, dPro),
    finalPriceAdvanced: computeFinalPrice(advanced, dAdv),
    discountBasic: dBasic,
    discountProfessional: dPro,
    discountAdvanced: dAdv,
  };
}
