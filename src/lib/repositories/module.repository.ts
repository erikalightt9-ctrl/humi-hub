import { prisma } from "@/lib/prisma";

export async function getModulesByCourse(courseId: string) {
  return prisma.module.findMany({
    where: { courseId },
    include: {
      _count: { select: { lessons: true, assignments: true } },
    },
    orderBy: { order: "asc" },
  });
}

export async function getPublishedModulesByCourse(courseId: string) {
  return prisma.module.findMany({
    where: { courseId, isPublished: true },
    include: {
      lessons: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
        select: { id: true, title: true, durationMin: true, tier: true },
      },
    },
    orderBy: { order: "asc" },
  });
}

export async function getModuleById(id: string) {
  return prisma.module.findUnique({
    where: { id },
    include: {
      lessons: { orderBy: { order: "asc" } },
      assignments: { orderBy: { order: "asc" } },
    },
  });
}

export async function createModule(data: {
  courseId: string;
  title: string;
  description?: string | null;
  order?: number;
  isPublished?: boolean;
}) {
  return prisma.module.create({ data });
}

export async function updateModule(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    order: number;
    isPublished: boolean;
  }>
) {
  return prisma.module.update({ where: { id }, data });
}

export async function deleteModule(id: string) {
  return prisma.module.delete({ where: { id } });
}
