import { prisma } from "@/lib/prisma";
import type { CourseResource } from "@prisma/client";

export async function getResourcesByCourse(courseId: string): Promise<CourseResource[]> {
  return prisma.courseResource.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getResourcesByCourses(courseIds: string[]): Promise<CourseResource[]> {
  if (courseIds.length === 0) return [];
  return prisma.courseResource.findMany({
    where: { courseId: { in: courseIds } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getResourcesByLesson(lessonId: string): Promise<CourseResource[]> {
  return prisma.courseResource.findMany({
    where: { lessonId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getResourceById(id: string): Promise<CourseResource | null> {
  return prisma.courseResource.findUnique({ where: { id } });
}

export async function createResource(data: {
  readonly courseId: string;
  readonly lessonId?: string;
  readonly title: string;
  readonly type: string;
  readonly filePath: string;
  readonly fileName: string;
  readonly fileSize: number;
}): Promise<CourseResource> {
  return prisma.courseResource.create({ data });
}

export async function deleteResource(id: string): Promise<void> {
  await prisma.courseResource.delete({ where: { id } });
}
