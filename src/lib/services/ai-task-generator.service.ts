import { generateJsonCompletion } from "@/lib/services/openai.service";
import type { CourseSlug } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GeneratedTask {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly instructions: string;
  readonly difficulty: "beginner" | "intermediate" | "advanced";
  readonly estimatedMinutes: number;
  readonly skills: ReadonlyArray<string>;
}

export interface TaskFeedback {
  readonly score: number;
  readonly feedback: string;
  readonly strengths: ReadonlyArray<string>;
  readonly improvements: ReadonlyArray<string>;
}

/* ------------------------------------------------------------------ */
/*  Course context for task generation                                 */
/* ------------------------------------------------------------------ */

const COURSE_CONTEXT: Record<CourseSlug, string> = {
  MEDICAL_VA: `Medical Virtual Assistant tasks including:
- Clinical documentation and medical records management
- Patient scheduling and appointment coordination
- Insurance verification and pre-authorization
- Medical coding basics (ICD-10, CPT)
- Patient communication and follow-up
- HIPAA compliance awareness
- Electronic Health Records (EHR) navigation`,

  REAL_ESTATE_VA: `Real Estate Virtual Assistant tasks including:
- Property listing creation and management (MLS)
- Client follow-up and CRM management
- Market research and comparative analysis
- Transaction coordination and document management
- Open house scheduling and marketing
- Lead generation and qualification
- Social media content for property marketing`,

  US_BOOKKEEPING_VA: `Bookkeeping Virtual Assistant tasks including:
- Invoice processing and accounts payable/receivable
- Bank reconciliation procedures
- Expense categorization and tracking
- Financial report preparation (P&L, Balance Sheet)
- QuickBooks Online navigation and data entry
- Tax document organization (1099s, W-9s)
- Payroll processing support`,
};

/* ------------------------------------------------------------------ */
/*  Generate a practice task                                           */
/* ------------------------------------------------------------------ */

const GENERATE_SYSTEM_PROMPT = `You are a task generator for a Virtual Assistant training program.

Generate a realistic, practical task that a VA student could complete to practice their skills.

Respond with a JSON object:
{
  "title": "Short task title (5-10 words)",
  "description": "Brief 1-2 sentence overview of what this task involves",
  "instructions": "Detailed step-by-step instructions (3-5 steps) that the student should follow to complete this task. Be specific and realistic.",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimatedMinutes": number (5-30),
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}

Make the task practical and realistic — something a real VA would encounter on the job.
Vary the difficulty based on the requested level.`;

export async function generateTask(
  courseSlug: CourseSlug,
  difficulty: "beginner" | "intermediate" | "advanced" = "intermediate",
): Promise<GeneratedTask> {
  const context = COURSE_CONTEXT[courseSlug] ?? "General Virtual Assistant tasks";

  const userPrompt = `Generate a ${difficulty}-level practice task for a student in this course:

**Course Focus Areas**:
${context}

**Difficulty**: ${difficulty}
${difficulty === "beginner" ? "Keep it simple — basic tasks with clear instructions." : ""}
${difficulty === "intermediate" ? "Moderate complexity — requires some decision-making and multi-step processes." : ""}
${difficulty === "advanced" ? "Complex scenario — requires critical thinking, prioritization, and professional judgment." : ""}

Generate one unique, practical task.`;

  const result = await generateJsonCompletion<Omit<GeneratedTask, "id">>(
    GENERATE_SYSTEM_PROMPT,
    userPrompt,
    { temperature: 0.9, maxTokens: 512 },
  );

  return {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: result.title || "Practice Task",
    description: result.description || "Complete this practice task.",
    instructions: result.instructions || "Follow the task instructions.",
    difficulty: result.difficulty || difficulty,
    estimatedMinutes: clampMinutes(result.estimatedMinutes),
    skills: Array.isArray(result.skills) ? result.skills : [],
  };
}

/* ------------------------------------------------------------------ */
/*  Evaluate a task answer                                             */
/* ------------------------------------------------------------------ */

const EVALUATE_SYSTEM_PROMPT = `You are an AI evaluator for a Virtual Assistant training program.

A student has completed a practice task and submitted their answer. Evaluate their work.

Respond with a JSON object:
{
  "score": number (0-100),
  "feedback": "Detailed paragraph evaluating the quality of work",
  "strengths": ["What they did well 1", "What they did well 2"],
  "improvements": ["How to improve 1", "How to improve 2"]
}

Be constructive and specific. Give honest scores:
- 90-100: Exceptional work
- 80-89: Strong work
- 70-79: Good, meets requirements
- 60-69: Adequate, needs polish
- Below 60: Needs significant improvement`;

export async function evaluateTaskAnswer(
  task: GeneratedTask,
  studentAnswer: string,
): Promise<TaskFeedback> {
  const userPrompt = `Evaluate this student's task submission:

**Task**: ${task.title}
**Description**: ${task.description}
**Instructions**: ${task.instructions}
**Difficulty**: ${task.difficulty}
**Skills Tested**: ${task.skills.join(", ")}

**Student's Answer**:
${studentAnswer}

Evaluate how well the student completed the task.`;

  const result = await generateJsonCompletion<TaskFeedback>(
    EVALUATE_SYSTEM_PROMPT,
    userPrompt,
    { temperature: 0.5, maxTokens: 512 },
  );

  return {
    score: clampScore(result.score),
    feedback: result.feedback || "Evaluation complete.",
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    improvements: Array.isArray(result.improvements) ? result.improvements : [],
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function clampScore(value: unknown): number {
  const num = typeof value === "number" ? value : 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function clampMinutes(value: unknown): number {
  const num = typeof value === "number" ? value : 15;
  return Math.max(5, Math.min(60, Math.round(num)));
}
