import { generateJsonCompletion } from "@/lib/services/openai.service";
import { getDetailedDataForAssessment } from "@/lib/repositories/feedback-engine.repository";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StrengthArea {
  readonly area: string;
  readonly evidence: string;
  readonly score: number;
}

interface ImprovementArea {
  readonly area: string;
  readonly suggestion: string;
  readonly priority: "high" | "medium" | "low";
}

export interface FullAssessment {
  readonly overallScore: number;
  readonly summary: string;
  readonly strengthAreas: ReadonlyArray<StrengthArea>;
  readonly improvementAreas: ReadonlyArray<ImprovementArea>;
  readonly learningRecommendation: string;
  readonly nextSteps: ReadonlyArray<string>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildDefaultAssessment(): FullAssessment {
  return {
    overallScore: 0,
    summary:
      "No AI evaluation data is available yet. Start using the AI training features to build your performance profile.",
    strengthAreas: [],
    improvementAreas: [
      {
        area: "Getting Started",
        suggestion:
          "Try a VA Simulation or Mock Interview to begin building your AI performance profile.",
        priority: "high",
      },
    ],
    learningRecommendation:
      "Begin your AI training journey by exploring the available features: VA Simulations, Mock Interviews, Email Practice, and AI-assessed Assignments. Each completed session contributes to your overall performance assessment.",
    nextSteps: [
      "Complete your first VA Simulation scenario",
      "Try a Mock Interview session",
      "Submit an assignment for AI evaluation",
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  System prompt                                                      */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are an expert learning analytics AI for a Virtual Assistant training program.

Analyze the student's complete AI evaluation history across all training modules and provide a comprehensive assessment.

Respond with JSON:
{
  "overallScore": number (0-100),
  "summary": "2-3 sentence executive summary",
  "strengthAreas": [{ "area": "string", "evidence": "string", "score": number }],
  "improvementAreas": [{ "area": "string", "suggestion": "string", "priority": "high|medium|low" }],
  "learningRecommendation": "One detailed paragraph with personalized learning path",
  "nextSteps": ["step1", "step2", "step3"]
}`;

/* ------------------------------------------------------------------ */
/*  Build user prompt from detailed data                               */
/* ------------------------------------------------------------------ */

function buildUserPrompt(
  features: ReadonlyArray<{
    readonly featureName: string;
    readonly sessions: ReadonlyArray<{
      readonly score: number;
      readonly feedback: string | null;
      readonly date: string;
    }>;
    readonly scores: ReadonlyArray<number>;
  }>,
): string {
  const sections = features.map((feature) => {
    if (feature.sessions.length === 0) {
      return `## ${feature.featureName}\nNo sessions completed yet.`;
    }

    const avgScore =
      feature.scores.length > 0
        ? Math.round(
            feature.scores.reduce((a, b) => a + b, 0) /
              feature.scores.length,
          )
        : 0;

    const sessionDetails = feature.sessions
      .map((s, i) => {
        const feedbackLine = s.feedback
          ? `  Feedback: ${s.feedback}`
          : "";
        return `  Session ${i + 1} (${s.date}): Score ${s.score}/100${feedbackLine}`;
      })
      .join("\n");

    return [
      `## ${feature.featureName}`,
      `Sessions completed: ${feature.sessions.length}`,
      `Average score: ${avgScore}/100`,
      `Score range: ${Math.min(...feature.scores)}-${Math.max(...feature.scores)}`,
      `\nRecent sessions:`,
      sessionDetails,
    ].join("\n");
  });

  return [
    "# Student AI Training Performance Data",
    "",
    "Analyze the following training data and provide a comprehensive assessment.",
    "",
    ...sections,
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/*  generateFullAssessment                                             */
/* ------------------------------------------------------------------ */

export async function generateFullAssessment(
  studentId: string,
): Promise<FullAssessment> {
  const detailedData = await getDetailedDataForAssessment(studentId);

  if (!detailedData.hasData) {
    return buildDefaultAssessment();
  }

  const userPrompt = buildUserPrompt(detailedData.features);

  const raw = await generateJsonCompletion<FullAssessment>(
    SYSTEM_PROMPT,
    userPrompt,
    { temperature: 0.5, maxTokens: 2048 },
  );

  return {
    overallScore: clamp(raw.overallScore ?? 0, 0, 100),
    summary: raw.summary ?? "",
    strengthAreas: Array.isArray(raw.strengthAreas)
      ? raw.strengthAreas.map((s) => ({
          area: s.area ?? "",
          evidence: s.evidence ?? "",
          score: clamp(s.score ?? 0, 0, 100),
        }))
      : [],
    improvementAreas: Array.isArray(raw.improvementAreas)
      ? raw.improvementAreas.map((a) => ({
          area: a.area ?? "",
          suggestion: a.suggestion ?? "",
          priority: (["high", "medium", "low"] as const).includes(
            a.priority as "high" | "medium" | "low",
          )
            ? (a.priority as "high" | "medium" | "low")
            : "medium",
        }))
      : [],
    learningRecommendation: raw.learningRecommendation ?? "",
    nextSteps: Array.isArray(raw.nextSteps)
      ? raw.nextSteps.map(String)
      : [],
  };
}
