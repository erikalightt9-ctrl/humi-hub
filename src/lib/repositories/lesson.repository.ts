import { prisma } from "@/lib/prisma";
import type { Lesson, LessonCompletion } from "@prisma/client";

export async function getLessonsByCourse(courseId: string): Promise<Lesson[]> {
  return prisma.lesson.findMany({
    where: { courseId, isPublished: true },
    orderBy: { order: "asc" },
  });
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  return prisma.lesson.findUnique({ where: { id } });
}

export async function createLesson(data: {
  courseId: string;
  title: string;
  content: string;
  order: number;
  durationMin?: number;
  isPublished?: boolean;
}): Promise<Lesson> {
  return prisma.lesson.create({ data });
}

export async function updateLesson(id: string, data: Partial<{
  title: string;
  content: string;
  order: number;
  durationMin: number;
  isPublished: boolean;
}>): Promise<Lesson> {
  return prisma.lesson.update({ where: { id }, data });
}

export async function deleteLesson(id: string): Promise<void> {
  await prisma.lesson.delete({ where: { id } });
}

export async function markLessonComplete(
  studentId: string,
  lessonId: string
): Promise<LessonCompletion> {
  return prisma.lessonCompletion.upsert({
    where: { studentId_lessonId: { studentId, lessonId } },
    create: { studentId, lessonId },
    update: { completedAt: new Date() },
  });
}

export interface CourseProgress {
  completed: number;
  total: number;
  percent: number;
}

export async function getCourseProgress(
  studentId: string,
  courseId: string
): Promise<CourseProgress> {
  const [total, completions] = await Promise.all([
    prisma.lesson.count({ where: { courseId, isPublished: true } }),
    prisma.lessonCompletion.count({
      where: {
        studentId,
        lesson: { courseId },
      },
    }),
  ]);
  const percent = total === 0 ? 0 : Math.round((completions / total) * 100);
  return { completed: completions, total, percent };
}

export async function getCompletedLessonIds(
  studentId: string,
  courseId: string
): Promise<string[]> {
  const completions = await prisma.lessonCompletion.findMany({
    where: { studentId, lesson: { courseId } },
    select: { lessonId: true },
  });
  return completions.map((c) => c.lessonId);
}

export async function getAllLessonsByCourse(courseId: string): Promise<Lesson[]> {
  return prisma.lesson.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
  });
}
