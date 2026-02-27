import { prisma } from "@/lib/prisma";
import { awardBadge, awardPoints } from "@/lib/repositories/gamification.repository";

export async function awardQuizBadgeIfEligible(studentId: string): Promise<void> {
  const passedCount = await prisma.quizAttempt.count({
    where: { studentId, passed: true },
  });

  if (passedCount >= 3) {
    await awardBadge(studentId, "QUIZ_MASTER");
  }
}

export async function onQuizPassed(studentId: string): Promise<void> {
  await awardPoints(studentId, 50, "Quiz passed");
  await awardQuizBadgeIfEligible(studentId);
}
