import { prisma } from "@/lib/prisma";
import { generateJsonCompletion } from "@/lib/services/openai.service";
import type { AIAssessmentResult } from "@/lib/types/ai.types";

/* ------------------------------------------------------------------ */
/*  Rate limit check (1 per submission per 24h)                        */
/* ------------------------------------------------------------------ */

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function canAssess(submissionId: string): Promise<boolean> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { aiEvaluatedAt: true },
  });

  if (!submission) return false;
  if (!submission.aiEvaluatedAt) return true;

  const elapsed = Date.now() - submission.aiEvaluatedAt.getTime();
  return elapsed >= COOLDOWN_MS;
}

/* ------------------------------------------------------------------ */
/*  AI Assessment                                                      */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are an AI skill assessment engine for a Virtual Assistant training program.

You evaluate student assignment submissions and provide structured feedback.

Based on the assignment instructions and submission context provided, evaluate the student's work and respond with a JSON object:

{
  "score": number (0-100),
  "feedback": "Detailed paragraph about the quality of work, what was done well, and what could be improved",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Improvement area 1", "Improvement area 2"],
  "skillsAssessed": ["Skill 1", "Skill 2", "Skill 3"]
}

Score rubric:
- 90-100: Exceptional work, exceeds expectations
- 80-89: Strong work, meets all requirements
- 70-79: Good work, meets most requirements
- 60-69: Adequate work, meets some requirements
- Below 60: Needs significant improvement

Be constructive and specific in your feedback. Reference the assignment requirements.
If a human grade is provided, use it as a reference point but provide your own independent evaluation.`;

export async function assessSubmission(
  submissionId: string,
): Promise<AIAssessmentResult> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: {
          course: { select: { title: true } },
        },
      },
      student: { select: { name: true } },
    },
  });

  if (!submission) {
    throw new Error("Submission not found");
  }

  const userPrompt = `Evaluate this student assignment submission:

**Student**: ${submission.student.name}
**Course**: ${submission.assignment.course.title}
**Assignment**: ${submission.assignment.title}
**Assignment Instructions**: ${submission.assignment.instructions}
**Max Points**: ${submission.assignment.maxPoints}

**Submission Details**:
- File: ${submission.fileName} (${formatFileSize(submission.fileSize)})
- Submitted: ${submission.submittedAt.toISOString()}
- Status: ${submission.status}
${submission.grade !== null ? `- Human Grade: ${submission.grade}/${submission.assignment.maxPoints}` : "- Not yet graded by instructor"}
${submission.feedback ? `- Instructor Feedback: ${submission.feedback}` : ""}

Please evaluate the submission quality based on the assignment requirements and provide your assessment.`;

  const result = await generateJsonCompletion<AIAssessmentResult>(
    SYSTEM_PROMPT,
    userPrompt,
    { temperature: 0.5, maxTokens: 768 },
  );

  // Validate and clamp score
  const assessment: AIAssessmentResult = {
    score: clampScore(result.score),
    feedback: result.feedback || "Assessment complete.",
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    improvements: Array.isArray(result.improvements) ? result.improvements : [],
    skillsAssessed: Array.isArray(result.skillsAssessed)
      ? result.skillsAssessed
      : [],
  };

  // Save to database
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      aiEvaluation: JSON.parse(JSON.stringify(assessment)),
      aiEvaluatedAt: new Date(),
    },
  });

  return assessment;
}

/* ------------------------------------------------------------------ */
/*  Get existing assessment                                            */
/* ------------------------------------------------------------------ */

export async function getAssessment(
  submissionId: string,
): Promise<AIAssessmentResult | null> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { aiEvaluation: true },
  });

  if (!submission?.aiEvaluation) return null;

  return submission.aiEvaluation as unknown as AIAssessmentResult;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function clampScore(value: unknown): number {
  const num = typeof value === "number" ? value : 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
