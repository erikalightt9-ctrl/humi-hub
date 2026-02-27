import { prisma } from "@/lib/prisma";
import type { Certificate } from "@prisma/client";

export async function getCertificate(
  studentId: string,
  courseId: string
): Promise<Certificate | null> {
  return prisma.certificate.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
}

export async function getCertificateByNumber(certNumber: string) {
  return prisma.certificate.findUnique({
    where: { certNumber },
    include: {
      student: { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
  });
}

export async function createCertificate(
  studentId: string,
  courseId: string
): Promise<Certificate> {
  return prisma.certificate.create({
    data: { studentId, courseId },
  });
}

export async function getStudentCertificates(studentId: string) {
  return prisma.certificate.findMany({
    where: { studentId },
    include: {
      course: { select: { title: true, slug: true } },
    },
    orderBy: { issuedAt: "desc" },
  });
}
