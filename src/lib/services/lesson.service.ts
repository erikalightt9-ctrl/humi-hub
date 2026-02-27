import { markLessonComplete, getCourseProgress, getLessonById } from "@/lib/repositories/lesson.repository";
import { checkAndIssueCertificate } from "@/lib/services/certificate.service";
import { onLessonComplete, onCourseCompleted } from "@/lib/services/gamification.service";
import type { LessonCompletion, Certificate } from "@prisma/client";

export interface LessonCompleteResult {
  completion: LessonCompletion;
  certificate: Certificate | null;
  pointsAwarded: number;
}

export async function completeLessonForStudent(
  studentId: string,
  lessonId: string
): Promise<LessonCompleteResult> {
  const lesson = await getLessonById(lessonId);
  if (!lesson) throw new Error("Lesson not found");

  const completion = await markLessonComplete(studentId, lessonId);
  await onLessonComplete(studentId, lesson.courseId);

  const progress = await getCourseProgress(studentId, lesson.courseId);
  let certificate: Certificate | null = null;

  if (progress.percent === 100) {
    certificate = await checkAndIssueCertificate(studentId, lesson.courseId);
    if (certificate) {
      await onCourseCompleted(studentId, lesson.courseId);
    }
  }

  return { completion, certificate, pointsAwarded: 10 };
}
