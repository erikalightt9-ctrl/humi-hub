import { generateJsonCompletion } from "@/lib/services/openai.service";
import {
  getControlTowerData,
  type StudentAnalyticsRow,
} from "@/lib/repositories/control-tower.repository";
import type { AutomationInsights } from "@/lib/types/ai.types";

/* ------------------------------------------------------------------ */
/*  In-memory cache (1 hour TTL)                                       */
/* ------------------------------------------------------------------ */

let _cache: { data: AutomationInsights; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function isCacheValid(): boolean {
  return _cache !== null && Date.now() - _cache.timestamp < CACHE_TTL_MS;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export async function generateAutomationInsights(
  forceRefresh = false,
): Promise<AutomationInsights> {
  if (!forceRefresh && isCacheValid() && _cache) {
    return _cache.data;
  }

  const controlTowerData = await getControlTowerData();

  // Calculate dropout risk scores locally first
  const riskedStudents = controlTowerData.students
    .map((s) => ({
      student: s,
      riskScore: calculateRiskScore(s),
      riskFactors: identifyRiskFactors(s),
    }))
    .filter((entry) => entry.riskScore >= 60)
    .sort((a, b) => b.riskScore - a.riskScore);

  // Build AI prompt data
  const studentSummaries = riskedStudents
    .map(
      (entry) =>
        `- ${entry.student.studentName} (${entry.student.courseTitle}): risk=${entry.riskScore}, factors=[${entry.riskFactors.join(", ")}], ` +
        `lessons=${entry.student.lessonsCompleted}/${entry.student.totalLessons}, ` +
        `quizAvg=${entry.student.quizAverage}%, ` +
        `attendance=${entry.student.attendanceCount}, ` +
        `points=${entry.student.totalPoints}`,
    )
    .join("\n");

  const courseSummaries = controlTowerData.courseAggregates
    .map(
      (c) =>
        `- ${c.courseTitle}: ${c.enrolledCount} enrolled, ${c.avgCompletionPercent}% avg completion, ${c.avgQuizScore}% avg quiz`,
    )
    .join("\n");

  const platformSummary =
    `Total students: ${controlTowerData.platformStats.totalStudents}, ` +
    `Active (7d): ${controlTowerData.platformStats.activeStudents}, ` +
    `Inactive (14d+): ${controlTowerData.platformStats.inactiveStudents}`;

  const userPrompt = `Analyze this HUMI Hub data and provide comprehensive automation insights.

**Platform Stats**:
${platformSummary}

**Course Aggregates**:
${courseSummaries || "No course data available"}

**High-Risk Students** (risk score >= 60):
${studentSummaries || "No high-risk students identified"}

**All Students Count**: ${controlTowerData.students.length}

Provide your analysis including:
1. A 2-3 sentence summary of platform health and key concerns
2. For each high-risk student, provide a specific suggested action (be concrete and actionable)
3. Completion predictions per course (estimate where each course is trending)
4. Automation suggestions (things the admin should automate, like sending reminder emails, scheduling check-ins, etc.)`;

  const aiResult = await generateJsonCompletion<AIControlTowerResponse>(
    SYSTEM_PROMPT,
    userPrompt,
    { temperature: 0.6, maxTokens: 2000 },
  );

  // Merge local risk calculations with AI-generated suggestions
  const dropoutRiskStudents = riskedStudents.map((entry) => {
    const aiSuggestion = (aiResult.dropoutRiskActions ?? []).find(
      (a) => a.studentName === entry.student.studentName,
    );

    return {
      studentId: entry.student.studentId,
      studentName: entry.student.studentName,
      courseTitle: entry.student.courseTitle,
      riskScore: entry.riskScore,
      riskFactors: entry.riskFactors,
      suggestedAction:
        aiSuggestion?.suggestedAction ??
        "Schedule a personal check-in to understand their situation and offer support.",
    };
  });

  const insights: AutomationInsights = {
    summary:
      aiResult.summary ?? "Platform analysis complete. Review details below.",
    dropoutRiskStudents,
    completionPredictions: (aiResult.completionPredictions ?? []).map(
      (pred) => ({
        courseTitle: pred.courseTitle,
        predictedCompletionRate: pred.predictedCompletionRate,
        currentCompletionRate: pred.currentCompletionRate,
        trend: pred.trend,
      }),
    ),
    automationSuggestions: (aiResult.automationSuggestions ?? []).map(
      (sug) => ({
        trigger: sug.trigger,
        action: sug.action,
        priority: sug.priority,
        affectedStudents: sug.affectedStudents,
      }),
    ),
    generatedAt: new Date().toISOString(),
  };

  _cache = { data: insights, timestamp: Date.now() };

  return insights;
}

/* ------------------------------------------------------------------ */
/*  Risk score calculation                                             */
/* ------------------------------------------------------------------ */

const WEIGHT_INACTIVITY = 0.4;
const WEIGHT_COMPLETION = 0.3;
const WEIGHT_ATTENDANCE = 0.2;
const WEIGHT_ENGAGEMENT = 0.1;

function calculateRiskScore(student: StudentAnalyticsRow): number {
  const daysSinceActivity = student.lastActivityDate
    ? Math.floor(
        (Date.now() - student.lastActivityDate.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 999;

  // Inactivity factor: 0 = active today, 100 = 30+ days inactive
  const inactivityScore = Math.min(
    100,
    Math.round((daysSinceActivity / 30) * 100),
  );

  // Completion factor: 0 = all lessons done, 100 = no lessons done
  const completionRate =
    student.totalLessons > 0
      ? student.lessonsCompleted / student.totalLessons
      : 0;
  const completionScore = Math.round((1 - completionRate) * 100);

  // Attendance factor: 0 = good attendance, 100 = no attendance
  // Consider 10+ attendance days as "good"
  const attendanceScore = Math.max(
    0,
    Math.min(100, Math.round((1 - student.attendanceCount / 10) * 100)),
  );

  // Engagement trend: based on points and badges as proxy
  const engagementProxy = student.totalPoints + student.badgesCount * 50;
  // 500+ points considered good engagement
  const engagementScore = Math.max(
    0,
    Math.min(100, Math.round((1 - engagementProxy / 500) * 100)),
  );

  const rawScore =
    inactivityScore * WEIGHT_INACTIVITY +
    completionScore * WEIGHT_COMPLETION +
    attendanceScore * WEIGHT_ATTENDANCE +
    engagementScore * WEIGHT_ENGAGEMENT;

  return Math.round(Math.min(100, Math.max(0, rawScore)));
}

/* ------------------------------------------------------------------ */
/*  Risk factor identification                                         */
/* ------------------------------------------------------------------ */

function identifyRiskFactors(
  student: StudentAnalyticsRow,
): ReadonlyArray<string> {
  const factors: string[] = [];

  const daysSinceActivity = student.lastActivityDate
    ? Math.floor(
        (Date.now() - student.lastActivityDate.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 999;

  if (daysSinceActivity >= 14) {
    factors.push(`Inactive for ${daysSinceActivity} days`);
  } else if (daysSinceActivity >= 7) {
    factors.push(`${daysSinceActivity} days since last activity`);
  }

  if (student.totalLessons > 0) {
    const completionPct = Math.round(
      (student.lessonsCompleted / student.totalLessons) * 100,
    );
    if (completionPct < 25) {
      factors.push(`Very low progress (${completionPct}%)`);
    } else if (completionPct < 50) {
      factors.push(`Below average progress (${completionPct}%)`);
    }
  }

  if (student.quizAverage < 50 && student.quizAverage > 0) {
    factors.push(`Low quiz average (${student.quizAverage}%)`);
  }

  if (student.attendanceCount === 0) {
    factors.push("No attendance recorded");
  } else if (student.attendanceCount < 3) {
    factors.push(`Low attendance (${student.attendanceCount} sessions)`);
  }

  if (student.submissionCount === 0) {
    factors.push("No assignments submitted");
  }

  if (student.totalPoints === 0) {
    factors.push("Zero engagement points");
  }

  return factors;
}

/* ------------------------------------------------------------------ */
/*  AI response shape                                                  */
/* ------------------------------------------------------------------ */

interface AIControlTowerResponse {
  readonly summary: string;
  readonly dropoutRiskActions: ReadonlyArray<{
    readonly studentName: string;
    readonly suggestedAction: string;
  }>;
  readonly completionPredictions: ReadonlyArray<{
    readonly courseTitle: string;
    readonly predictedCompletionRate: number;
    readonly currentCompletionRate: number;
    readonly trend: "improving" | "stable" | "declining";
  }>;
  readonly automationSuggestions: ReadonlyArray<{
    readonly trigger: string;
    readonly action: string;
    readonly priority: "high" | "medium" | "low";
    readonly affectedStudents: number;
  }>;
}

/* ------------------------------------------------------------------ */
/*  System prompt                                                      */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are an AI automation assistant for a Virtual Assistant training platform admin dashboard (the "Control Tower").

Analyze platform data and provide predictive analytics plus automation recommendations.

You must respond with a JSON object containing:
{
  "summary": "2-3 sentence overview of platform health, key concerns, and trends",
  "dropoutRiskActions": [
    { "studentName": "exact name from data", "suggestedAction": "Specific, actionable step to re-engage this student" }
  ],
  "completionPredictions": [
    {
      "courseTitle": "exact course name",
      "predictedCompletionRate": 75,
      "currentCompletionRate": 60,
      "trend": "improving|stable|declining"
    }
  ],
  "automationSuggestions": [
    {
      "trigger": "When X condition is met",
      "action": "Automatically do Y",
      "priority": "high|medium|low",
      "affectedStudents": 5
    }
  ]
}

Guidelines:
- For dropout risk actions, provide SPECIFIC and PERSONALIZED actions (e.g., "Send a personalized email offering a 1-on-1 tutoring session")
- For completion predictions, use current rates and student behavior patterns to predict future rates
- For automation suggestions, think like a proactive admin: reminders, escalations, recognitions, check-ins
- Priority should reflect urgency: high = immediate action needed, medium = within a week, low = nice to have
- Be concrete — avoid generic advice like "monitor the situation"
- Reference actual student names and courses from the data`;
