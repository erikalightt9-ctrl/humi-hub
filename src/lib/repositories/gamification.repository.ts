import { prisma } from "@/lib/prisma";
import type { BadgeType } from "@prisma/client";

export async function awardPoints(
  studentId: string,
  points: number,
  reason: string
): Promise<void> {
  await prisma.pointTransaction.create({
    data: { studentId, points, reason },
  });
}

export async function getStudentPoints(studentId: string): Promise<number> {
  const result = await prisma.pointTransaction.aggregate({
    where: { studentId },
    _sum: { points: true },
  });
  return result._sum.points ?? 0;
}

export async function awardBadge(
  studentId: string,
  badgeType: BadgeType
): Promise<void> {
  const badge = await prisma.badge.findUnique({ where: { type: badgeType } });
  if (!badge) return;

  await prisma.studentBadge.upsert({
    where: { studentId_badgeId: { studentId, badgeId: badge.id } },
    create: { studentId, badgeId: badge.id },
    update: {},
  });
}

export async function getStudentBadges(studentId: string) {
  return prisma.studentBadge.findMany({
    where: { studentId },
    include: { badge: true },
    orderBy: { earnedAt: "desc" },
  });
}

export async function getLeaderboard(courseId: string, limit = 10) {
  // Get students enrolled in the course and their total points
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId, status: "APPROVED" },
    include: { student: { select: { id: true, name: true } } },
  });

  const studentIds = enrollments
    .map((e) => e.student?.id)
    .filter((id): id is string => !!id);

  const pointTotals = await prisma.pointTransaction.groupBy({
    by: ["studentId"],
    where: { studentId: { in: studentIds } },
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
    take: limit,
  });

  return pointTotals.map((pt, index) => {
    const enrollment = enrollments.find((e) => e.student?.id === pt.studentId);
    return {
      rank: index + 1,
      studentId: pt.studentId,
      name: enrollment?.student?.name ?? "Unknown",
      points: pt._sum.points ?? 0,
    };
  });
}

export async function getStudentPointHistory(studentId: string) {
  return prisma.pointTransaction.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
