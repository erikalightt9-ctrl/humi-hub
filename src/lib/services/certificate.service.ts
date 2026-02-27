import { getCertificate, createCertificate } from "@/lib/repositories/certificate.repository";
import { getCourseProgress } from "@/lib/repositories/lesson.repository";
import type { Certificate } from "@prisma/client";

export async function checkAndIssueCertificate(
  studentId: string,
  courseId: string
): Promise<Certificate | null> {
  const existing = await getCertificate(studentId, courseId);
  if (existing) return existing;

  const progress = await getCourseProgress(studentId, courseId);
  if (progress.total === 0 || progress.percent < 100) return null;

  return createCertificate(studentId, courseId);
}
