import { generateJsonCompletion } from "@/lib/services/openai.service";
import {
  getStudentDataForScoring,
  saveScore,
  getLatestScore,
} from "@/lib/repositories/career-readiness.repository";
import type { CareerReadinessScoreData } from "@/lib/types/ai.types";

/* ------------------------------------------------------------------ */
/*  Rate limit check                                                   */
/* ------------------------------------------------------------------ */

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function canEvaluate(studentId: string): Promise<boolean> {
  const latest = await getLatestScore(studentId);
  if (!latest) return true;

  const elapsed = Date.now() - latest.evaluatedAt.getTime();
  return elapsed >= COOLDOWN_MS;
}

/* ------------------------------------------------------------------ */
/*  AI Career Readiness Evaluation                                     */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are an AI career readiness evaluator for a Virtual Assistant training program.

You will receive a student's performance metrics and must evaluate their job readiness across 6 dimensions.

Score each dimension from 0 to 100 based on the evidence provided:

1. **communication** — Based on forum participation, assignment quality. Active discussion = higher score.
2. **accuracy** — Based on quiz average and assignment grades. Higher scores = higher accuracy.
3. **speed** — Based on lesson completion rate vs days enrolled. Faster progress = higher score.
4. **reliability** — Based on attendance days and consistent activity. Regular attendance = higher score.
5. **technicalSkills** — Based on badges earned, total points, and course-specific achievements.
6. **professionalism** — Based on attendance consistency, forum etiquette, and overall engagement pattern.

Calculate **overallScore** as a weighted average:
- communication: 20%
- accuracy: 25%
- speed: 10%
- reliability: 20%
- technicalSkills: 15%
- professionalism: 10%

Provide a brief **aiSummary** (2-3 sentences) that highlights strengths and areas for improvement.

Respond with a JSON object matching this exact structure:
{
  "communication": number,
  "accuracy": number,
  "speed": number,
  "reliability": number,
  "technicalSkills": number,
  "professionalism": number,
  "overallScore": number,
  "aiSummary": "string"
}`;

export async function calculateCareerReadiness(
  studentId: string,
): Promise<CareerReadinessScoreData> {
  const metrics = await getStudentDataForScoring(studentId);

  if (!metrics) {
    throw new Error("Student not found or has no enrollment data");
  }

  const completionPercent =
    metrics.totalLessons > 0
      ? Math.round((metrics.lessonsCompleted / metrics.totalLessons) * 100)
      : 0;

  const userPrompt = `Evaluate the career readiness of this VA student:

**Student**: ${metrics.studentName}
**Course**: ${metrics.courseTitle} (${metrics.courseSlug})
**Days Since Enrollment**: ${metrics.daysSinceEnrollment}

**Performance Metrics**:
- Quiz Average Score: ${metrics.quizAverage}%
- Assignment Average Grade: ${metrics.assignmentAverage}/100
- Lessons Completed: ${metrics.lessonsCompleted}/${metrics.totalLessons} (${completionPercent}%)
- Attendance Days: ${metrics.attendanceDays}
- Forum Posts: ${metrics.forumPosts}
- Badges Earned: ${metrics.badgesEarned}
- Total Points: ${metrics.totalPoints}

Please evaluate each dimension and provide the career readiness scores.`;

  const result = await generateJsonCompletion<CareerReadinessScoreData>(
    SYSTEM_PROMPT,
    userPrompt,
    { temperature: 0.5, maxTokens: 512 },
  );

  // Clamp all scores to 0-100 range
  const clamped: CareerReadinessScoreData = {
    communication: clampScore(result.communication),
    accuracy: clampScore(result.accuracy),
    speed: clampScore(result.speed),
    reliability: clampScore(result.reliability),
    technicalSkills: clampScore(result.technicalSkills),
    professionalism: clampScore(result.professionalism),
    overallScore: clampScore(result.overallScore),
    aiSummary: result.aiSummary || "Evaluation complete.",
  };

  // Save to database
  await saveScore({
    studentId,
    ...clamped,
  });

  return clamped;
}

function clampScore(value: unknown): number {
  const num = typeof value === "number" ? value : 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}
