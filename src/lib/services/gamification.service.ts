import {
  awardPoints,
  awardBadge,
  getStudentPoints,
} from "@/lib/repositories/gamification.repository";
import { prisma } from "@/lib/prisma";

export async function onLessonComplete(studentId: string, courseId: string): Promise<void> {
  await awardPoints(studentId, 10, "Lesson completed");

  // Check FIRST_LESSON badge
  const completionCount = await prisma.lessonCompletion.count({ where: { studentId } });
  if (completionCount === 1) {
    await awardBadge(studentId, "FIRST_LESSON");
  }
}

export async function onQuizPassed(studentId: string): Promise<void> {
  await awardPoints(studentId, 50, "Quiz passed");

  const passedCount = await prisma.quizAttempt.count({
    where: { studentId, passed: true },
  });
  if (passedCount >= 3) {
    await awardBadge(studentId, "QUIZ_MASTER");
  }
}

export async function onAssignmentSubmitted(studentId: string): Promise<void> {
  await awardPoints(studentId, 20, "Assignment submitted");

  const submissionCount = await prisma.submission.count({ where: { studentId } });
  if (submissionCount >= 1) {
    await awardBadge(studentId, "ASSIGNMENT_STAR");
  }
}

export async function onForumPost(studentId: string): Promise<void> {
  await awardPoints(studentId, 5, "Forum post");

  const postCount = await prisma.forumPost.count({ where: { studentId } });
  if (postCount === 1) {
    await awardBadge(studentId, "FORUM_STARTER");
  }

  if (postCount >= 10) {
    await awardBadge(studentId, "TOP_CONTRIBUTOR");
  }
}

export async function onCourseCompleted(studentId: string, courseId: string): Promise<void> {
  await awardPoints(studentId, 100, "Course completed");
  await awardBadge(studentId, "COURSE_COMPLETER");
}
