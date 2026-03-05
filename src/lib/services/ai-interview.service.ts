import { generateJsonCompletion } from "@/lib/services/openai.service";
import {
  createSession,
  getSession,
  updateLastQuestion,
  addQuestion,
  completeSession,
} from "@/lib/repositories/interview.repository";
import type { InterviewQuestion } from "@/lib/types/ai.types";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MAX_QUESTIONS = 5;

/* ------------------------------------------------------------------ */
/*  Interview role definitions per course                              */
/* ------------------------------------------------------------------ */

export interface InterviewRole {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

const ROLES: Record<string, ReadonlyArray<InterviewRole>> = {
  MEDICAL_VA: [
    {
      id: "medical_office_manager",
      title: "Medical Office Manager",
      description:
        "Interview with a medical office manager seeking a VA to handle patient scheduling, insurance verification, and medical records management.",
    },
    {
      id: "healthcare_clinic_director",
      title: "Healthcare Clinic Director",
      description:
        "Interview with a clinic director looking for a VA experienced in HIPAA compliance, EHR systems, and patient communication.",
    },
  ],
  REAL_ESTATE_VA: [
    {
      id: "real_estate_broker",
      title: "Real Estate Broker",
      description:
        "Interview with a busy real estate broker who needs a VA for listing management, lead follow-up, and transaction coordination.",
    },
    {
      id: "property_management_company",
      title: "Property Management Company",
      description:
        "Interview with a property management firm seeking a VA for tenant communications, maintenance coordination, and lease administration.",
    },
  ],
  US_BOOKKEEPING_VA: [
    {
      id: "small_business_owner",
      title: "Small Business Owner",
      description:
        "Interview with a small business owner looking for a VA to manage invoicing, expense tracking, and basic financial reporting.",
    },
    {
      id: "accounting_firm_manager",
      title: "Accounting Firm Manager",
      description:
        "Interview with an accounting firm manager seeking a VA proficient in QuickBooks, accounts payable/receivable, and bank reconciliation.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Get available roles for a course                                   */
/* ------------------------------------------------------------------ */

export function getInterviewRoles(
  courseSlug: string,
): ReadonlyArray<InterviewRole> {
  return ROLES[courseSlug] ?? [];
}

/* ------------------------------------------------------------------ */
/*  Start interview                                                    */
/* ------------------------------------------------------------------ */

export async function startInterview(
  studentId: string,
  roleId: string,
  courseSlug: string,
) {
  const allRoles = ROLES[courseSlug] ?? [];
  const role = allRoles.find((r) => r.id === roleId);

  if (!role) {
    throw new Error("Interview role not found");
  }

  const result = await generateJsonCompletion<{
    readonly question: string;
  }>(
    buildInterviewerSystemPrompt(role, courseSlug),
    `You are starting a mock interview. Ask the first question to the VA candidate. The question should be an introductory/warm-up question relevant to the ${role.title} position.

Respond with JSON: { "question": "your question here" }`,
    { temperature: 0.8, maxTokens: 300 },
  );

  const firstQuestion: InterviewQuestion = {
    question: result.question,
    answer: null,
    aiFollowUp: null,
    score: null,
  };

  const session = await createSession(
    studentId,
    roleId,
    courseSlug,
    firstQuestion,
  );

  return { session, role };
}

/* ------------------------------------------------------------------ */
/*  Answer question                                                    */
/* ------------------------------------------------------------------ */

interface AnswerEvaluation {
  readonly followUp: string | null;
  readonly nextQuestion: string | null;
  readonly score: number;
}

export async function answerQuestion(
  sessionId: string,
  answer: string,
) {
  const session = await getSession(sessionId);
  if (!session || session.status !== "active") {
    throw new Error("Session not found or already completed");
  }

  const allRoles = ROLES[session.courseSlug] ?? [];
  const role = allRoles.find((r) => r.id === session.role);
  if (!role) throw new Error("Interview role not found");

  const currentQuestionIndex = session.questions.length;
  const isLastQuestion = currentQuestionIndex >= MAX_QUESTIONS;
  const currentQuestion = session.questions[session.questions.length - 1];

  if (!currentQuestion) {
    throw new Error("No current question found");
  }

  // Build context of previous Q&A for the AI
  const previousQA = session.questions
    .slice(0, -1)
    .map(
      (q, i) =>
        `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.answer ?? "(no answer)"}`,
    )
    .join("\n\n");

  const evaluation = await generateJsonCompletion<AnswerEvaluation>(
    buildInterviewerSystemPrompt(role, session.courseSlug),
    `You are conducting question ${currentQuestionIndex} of ${MAX_QUESTIONS} in this mock interview.

${previousQA ? `Previous Q&A:\n${previousQA}\n\n` : ""}Current question: "${currentQuestion.question}"
Candidate's answer: "${answer}"

Evaluate the answer (score 0-100) based on relevance, depth, and professionalism.

${
  isLastQuestion
    ? "This is the last question. Set nextQuestion to null."
    : "Also generate the next interview question that builds on the conversation so far."
}

If the answer warrants a brief follow-up comment before moving on, include it in followUp. Otherwise set followUp to null.

Respond with JSON:
{
  "score": number,
  "followUp": "brief comment or null",
  "nextQuestion": "next question or null"
}`,
    { temperature: 0.7, maxTokens: 500 },
  );

  // Update the current question with the answer and evaluation
  const updatedQuestion: InterviewQuestion = {
    question: currentQuestion.question,
    answer,
    aiFollowUp: evaluation.followUp ?? null,
    score: clamp(evaluation.score),
  };

  const updatedSession = await updateLastQuestion(
    sessionId,
    updatedQuestion,
  );

  // If there is a next question, add it
  if (evaluation.nextQuestion && !isLastQuestion) {
    const nextQ: InterviewQuestion = {
      question: evaluation.nextQuestion,
      answer: null,
      aiFollowUp: null,
      score: null,
    };

    const sessionWithNext = await addQuestion(sessionId, nextQ);
    return sessionWithNext;
  }

  return updatedSession;
}

/* ------------------------------------------------------------------ */
/*  End interview & score                                              */
/* ------------------------------------------------------------------ */

interface InterviewScores {
  readonly communicationScore: number;
  readonly knowledgeScore: number;
  readonly problemSolvingScore: number;
  readonly professionalismScore: number;
  readonly overallScore: number;
  readonly aiFeedback: string;
}

export async function endInterview(sessionId: string) {
  const session = await getSession(sessionId);
  if (!session || session.status !== "active") {
    throw new Error("Session not found or already completed");
  }

  const allRoles = ROLES[session.courseSlug] ?? [];
  const role = allRoles.find((r) => r.id === session.role);

  const qaText = session.questions
    .map(
      (q, i) =>
        `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.answer ?? "(unanswered)"}\nScore: ${q.score ?? "N/A"}`,
    )
    .join("\n\n");

  const scores = await generateJsonCompletion<InterviewScores>(
    `You are a senior hiring evaluator assessing a Virtual Assistant candidate's mock interview performance.

Score each dimension from 0 to 100:

1. **communicationScore** -- Clarity, grammar, tone, ability to articulate thoughts
2. **knowledgeScore** -- Domain knowledge, understanding of the role and industry
3. **problemSolvingScore** -- Ability to think on their feet, propose solutions, handle scenarios
4. **professionalismScore** -- Courteous, confident, appropriate language, interview etiquette

Calculate **overallScore** as the weighted average: communication 25%, knowledge 30%, problem-solving 25%, professionalism 20%.

Provide **aiFeedback** -- a 3-4 sentence summary covering strengths, areas for improvement, and a specific recommendation for practice.

Respond with JSON:
{
  "communicationScore": number,
  "knowledgeScore": number,
  "problemSolvingScore": number,
  "professionalismScore": number,
  "overallScore": number,
  "aiFeedback": "string"
}`,
    `Evaluate this VA candidate's mock interview performance:

**Role interviewed for**: ${role?.title ?? session.role}
**Role description**: ${role?.description ?? "Virtual Assistant"}
**Course**: ${session.courseSlug}

**Interview Q&A**:
${qaText}

**Total questions answered**: ${session.questions.filter((q) => q.answer !== null).length} of ${session.questions.length}

Evaluate the candidate's overall interview performance.`,
    { temperature: 0.5, maxTokens: 1500 },
  );

  const clampedScores = {
    communicationScore: clamp(scores.communicationScore),
    knowledgeScore: clamp(scores.knowledgeScore),
    problemSolvingScore: clamp(scores.problemSolvingScore),
    professionalismScore: clamp(scores.professionalismScore),
    overallScore: clamp(scores.overallScore),
    aiFeedback: scores.aiFeedback || "Interview complete.",
  };

  return completeSession(sessionId, clampedScores);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildInterviewerSystemPrompt(
  role: InterviewRole,
  courseSlug: string,
): string {
  return `You are role-playing as a "${role.title}" conducting a mock interview with a Virtual Assistant candidate.

**Your Role**: ${role.title}
**Context**: ${role.description}
**Course specialization**: ${courseSlug.replace(/_/g, " ")}

You are interviewing a VA student to evaluate their readiness for a real client engagement. Ask professional, realistic questions that test:
- Industry knowledge relevant to the role
- Communication skills and professionalism
- Problem-solving ability with realistic scenarios
- Technical skills and tool familiarity

IMPORTANT rules:
- Stay in character as the interviewer
- Be professional but conversational
- Ask one question at a time
- Questions should progressively get more specific/challenging
- Never break character or reveal you are an AI`;
}

function clamp(value: unknown): number {
  const num = typeof value === "number" ? value : 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}
