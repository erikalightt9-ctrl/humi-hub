import { generateJsonCompletion } from "@/lib/services/openai.service";
import { getPerformanceOverview } from "@/lib/repositories/ai-admin-insights.repository";
import type {
  AIPerformanceInsights,
  PerformanceOverviewData,
  AtRiskStudentWithRecommendation,
  SkillGap,
} from "@/lib/types/ai.types";

/* ------------------------------------------------------------------ */
/*  In-memory cache (1 hour TTL)                                       */
/* ------------------------------------------------------------------ */

let cachedInsights: AIPerformanceInsights | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function isCacheValid(): boolean {
  return cachedInsights !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

/* ------------------------------------------------------------------ */
/*  Get insights (cached or fresh)                                     */
/* ------------------------------------------------------------------ */

export async function getInsights(
  forceRefresh = false,
): Promise<AIPerformanceInsights> {
  if (!forceRefresh && isCacheValid() && cachedInsights) {
    return cachedInsights;
  }

  const overview = await getPerformanceOverview();
  const insights = await generateInsights(overview);

  cachedInsights = insights;
  cacheTimestamp = Date.now();

  return insights;
}

/* ------------------------------------------------------------------ */
/*  AI generation                                                      */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are an AI analytics assistant for a Virtual Assistant training platform admin.

Analyze the platform performance data and provide actionable insights.

You must respond with a JSON object containing:
{
  "platformSummary": "A 2-3 sentence overview of platform health and key trends",
  "atRiskRecommendations": [
    { "studentId": "id", "recommendation": "Specific action to re-engage this student" }
  ],
  "skillGaps": [
    { "courseTitle": "course name", "gap": "description of skill gap", "severity": "low|medium|high" }
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3"
  ]
}

Be specific and actionable. Avoid generic advice. Reference specific courses and metrics when possible.`;

async function generateInsights(
  overview: PerformanceOverviewData,
): Promise<AIPerformanceInsights> {
  const courseDetails = overview.courseMetrics
    .map(
      (c) =>
        `- ${c.courseTitle}: ${c.enrolledCount} enrolled, ${c.avgQuizScore}% avg quiz, ${c.completionRate}% completion, ${c.submissionRate}% assignment submission`,
    )
    .join("\n");

  const atRiskDetails = overview.atRiskStudents
    .map(
      (s) =>
        `- ${s.studentName} (${s.courseTitle}): ${s.daysSinceActive} days inactive, ${s.lessonsCompleted}/${s.totalLessons} lessons`,
    )
    .join("\n");

  const topDetails = overview.topPerformers
    .map(
      (s) =>
        `- ${s.studentName} (${s.courseTitle}): ${s.totalPoints} points, ${s.quizAverage}% quiz avg, ${s.badgeCount} badges`,
    )
    .join("\n");

  const userPrompt = `Analyze this VA Training Center platform data:

**Overview**:
- Total Active Students: ${overview.totalStudents}
- Total Courses: ${overview.totalCourses}

**Course Metrics**:
${courseDetails || "No course data available"}

**Top Performers**:
${topDetails || "No top performers data"}

**At-Risk Students** (inactive >7 days):
${atRiskDetails || "No at-risk students identified"}

Provide your analysis and recommendations.`;

  const aiResult = await generateJsonCompletion<{
    platformSummary: string;
    atRiskRecommendations: ReadonlyArray<{
      studentId: string;
      recommendation: string;
    }>;
    skillGaps: ReadonlyArray<SkillGap>;
    recommendations: ReadonlyArray<string>;
  }>(SYSTEM_PROMPT, userPrompt, { temperature: 0.6, maxTokens: 1024 });

  // Merge at-risk students with AI recommendations
  const atRiskWithRecs: AtRiskStudentWithRecommendation[] =
    overview.atRiskStudents.map((student) => {
      const rec = aiResult.atRiskRecommendations?.find(
        (r) => r.studentId === student.studentId,
      );
      return {
        ...student,
        recommendation:
          rec?.recommendation ??
          "Consider reaching out to understand their situation and offer support.",
      };
    });

  return {
    platformSummary:
      aiResult.platformSummary ?? "Platform data analysis complete.",
    topPerformers: overview.topPerformers,
    atRiskStudents: atRiskWithRecs,
    skillGaps: aiResult.skillGaps ?? [],
    recommendations: aiResult.recommendations ?? [],
    generatedAt: new Date().toISOString(),
  };
}
