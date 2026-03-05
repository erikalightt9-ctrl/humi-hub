import { generateJsonCompletion } from "@/lib/services/openai.service";
import { getWorkPaceData } from "@/lib/repositories/work-pace.repository";
import type {
  WorkPaceMetrics,
  WeeklyActivity,
  WorkPaceAnalysis,
} from "@/lib/types/ai.types";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours
const WEEKLY_TREND_WEEKS = 8;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_PER_WEEK = MS_PER_DAY * 7;

/* ------------------------------------------------------------------ */
/*  In-memory rate limit store (per student)                           */
/* ------------------------------------------------------------------ */

const lastAnalysisTimestamps = new Map<string, number>();

export function canAnalyze(studentId: string): boolean {
  const lastTimestamp = lastAnalysisTimestamps.get(studentId);
  if (!lastTimestamp) return true;

  const elapsed = Date.now() - lastTimestamp;
  return elapsed >= COOLDOWN_MS;
}

function recordAnalysis(studentId: string): void {
  lastAnalysisTimestamps.set(studentId, Date.now());
}

/* ------------------------------------------------------------------ */
/*  Date helpers (pure)                                                */
/* ------------------------------------------------------------------ */

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getWeekLabel(date: Date): string {
  const startOfWeek = new Date(date);
  const dayOfWeek = startOfWeek.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  return toDateString(startOfWeek);
}

function getWeeksSinceEnrollment(enrollmentDate: Date): number {
  const elapsed = Date.now() - enrollmentDate.getTime();
  return Math.max(1, Math.ceil(elapsed / MS_PER_WEEK));
}

/* ------------------------------------------------------------------ */
/*  Streak calculation (pure)                                          */
/* ------------------------------------------------------------------ */

interface StreakResult {
  readonly currentStreak: number;
  readonly longestStreak: number;
}

function calculateStreaks(sortedDates: ReadonlyArray<string>): StreakResult {
  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const uniqueDays = [...new Set(sortedDates)].sort();

  let currentStreak = 1;
  let longestStreak = 1;
  let runningStreak = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    const prevDate = new Date(uniqueDays[i - 1]);
    const currDate = new Date(uniqueDays[i]);
    const diffDays = Math.round(
      (currDate.getTime() - prevDate.getTime()) / MS_PER_DAY,
    );

    if (diffDays === 1) {
      runningStreak += 1;
    } else {
      runningStreak = 1;
    }

    longestStreak = Math.max(longestStreak, runningStreak);
  }

  // Current streak: count backwards from the last activity date
  const today = toDateString(new Date());
  const lastDay = uniqueDays[uniqueDays.length - 1];
  const daysSinceLast = Math.round(
    (new Date(today).getTime() - new Date(lastDay).getTime()) / MS_PER_DAY,
  );

  // If last activity was more than 1 day ago, current streak is 0
  if (daysSinceLast > 1) {
    currentStreak = 0;
  } else {
    currentStreak = 1;
    for (let i = uniqueDays.length - 2; i >= 0; i--) {
      const prevDate = new Date(uniqueDays[i]);
      const currDate = new Date(uniqueDays[i + 1]);
      const diffDays = Math.round(
        (currDate.getTime() - prevDate.getTime()) / MS_PER_DAY,
      );

      if (diffDays === 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}

/* ------------------------------------------------------------------ */
/*  Weekly trend calculation (pure)                                    */
/* ------------------------------------------------------------------ */

function buildWeeklyTrend(
  lessonDates: ReadonlyArray<Date>,
  quizDates: ReadonlyArray<Date>,
  attendanceDates: ReadonlyArray<Date>,
): ReadonlyArray<WeeklyActivity> {
  const now = new Date();
  const weeks: WeeklyActivity[] = [];

  for (let i = WEEKLY_TREND_WEEKS - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekLabel = getWeekLabel(weekStart);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const lessons = lessonDates.filter(
      (d) => getWeekLabel(d) === weekLabel,
    ).length;

    const quizzes = quizDates.filter(
      (d) => getWeekLabel(d) === weekLabel,
    ).length;

    const attendanceDays = new Set(
      attendanceDates
        .filter((d) => getWeekLabel(d) === weekLabel)
        .map((d) => toDateString(d)),
    ).size;

    weeks.push({ week: weekLabel, lessons, quizzes, attendanceDays });
  }

  return weeks;
}

/* ------------------------------------------------------------------ */
/*  Calculate Metrics                                                  */
/* ------------------------------------------------------------------ */

export async function calculateMetrics(
  studentId: string,
): Promise<WorkPaceMetrics & { readonly courseContext: CourseContext }> {
  const rawData = await getWorkPaceData(studentId);

  if (!rawData) {
    throw new Error("Student not found or has no enrollment data");
  }

  const weeksSinceEnrollment = getWeeksSinceEnrollment(rawData.enrollmentDate);

  // Lessons per week
  const lessonsPerWeek = Number(
    (rawData.lessonCompletions.length / weeksSinceEnrollment).toFixed(2),
  );

  // Average time between lesson completions (in hours)
  const completionDates = rawData.lessonCompletions.map((c) => c.completedAt);
  let avgTimeBetweenLessons = 0;

  if (completionDates.length >= 2) {
    let totalGapHours = 0;
    for (let i = 1; i < completionDates.length; i++) {
      const gap =
        completionDates[i].getTime() - completionDates[i - 1].getTime();
      totalGapHours += gap / (1000 * 60 * 60);
    }
    avgTimeBetweenLessons = Number(
      (totalGapHours / (completionDates.length - 1)).toFixed(1),
    );
  }

  // Quiz attempts per week
  const quizAttemptsPerWeek = Number(
    (rawData.quizAttempts.length / weeksSinceEnrollment).toFixed(2),
  );

  // Attendance rate: unique attendance days / expected days
  const expectedDaysPerWeek = rawData.scheduleDaysOfWeek.length;
  const expectedTotalDays = expectedDaysPerWeek * weeksSinceEnrollment;
  const uniqueAttendanceDays = new Set(
    rawData.attendanceRecords.map((r) => toDateString(r.clockIn)),
  ).size;
  const attendanceRate =
    expectedTotalDays > 0
      ? Number(
          ((uniqueAttendanceDays / expectedTotalDays) * 100).toFixed(1),
        )
      : 0;

  // All activity dates for streak calculation
  const allActivityDates: string[] = [
    ...rawData.lessonCompletions.map((c) => toDateString(c.completedAt)),
    ...rawData.quizAttempts.map((q) => toDateString(q.completedAt)),
    ...rawData.attendanceRecords.map((a) => toDateString(a.clockIn)),
  ].sort();

  const { currentStreak, longestStreak } = calculateStreaks(allActivityDates);

  // Total active days
  const totalActiveDays = new Set(allActivityDates).size;

  // Days since last activity
  const allDates = [
    ...rawData.lessonCompletions.map((c) => c.completedAt),
    ...rawData.quizAttempts.map((q) => q.completedAt),
    ...rawData.attendanceRecords.map((a) => a.clockIn),
  ];

  const lastActivityDate =
    allDates.length > 0
      ? new Date(Math.max(...allDates.map((d) => d.getTime())))
      : rawData.enrollmentDate;

  const daysSinceLastActivity = Math.floor(
    (Date.now() - lastActivityDate.getTime()) / MS_PER_DAY,
  );

  // Weekly trend
  const weeklyTrend = buildWeeklyTrend(
    rawData.lessonCompletions.map((c) => c.completedAt),
    rawData.quizAttempts.map((q) => q.completedAt),
    rawData.attendanceRecords.map((a) => a.clockIn),
  );

  const metrics: WorkPaceMetrics = {
    lessonsPerWeek,
    avgTimeBetweenLessons,
    quizAttemptsPerWeek,
    attendanceRate,
    currentStreak,
    longestStreak,
    totalActiveDays,
    daysSinceLastActivity,
    weeklyTrend,
  };

  const courseContext: CourseContext = {
    courseTitle: rawData.courseTitle,
    courseSlug: rawData.courseSlug,
    totalLessons: rawData.totalLessons,
    lessonsCompleted: rawData.lessonCompletions.length,
    courseDurationWeeks: rawData.courseDurationWeeks,
    weeksSinceEnrollment,
    studentName: rawData.studentName,
  };

  return { ...metrics, courseContext };
}

/* ------------------------------------------------------------------ */
/*  Course context for AI prompt                                       */
/* ------------------------------------------------------------------ */

interface CourseContext {
  readonly courseTitle: string;
  readonly courseSlug: string;
  readonly totalLessons: number;
  readonly lessonsCompleted: number;
  readonly courseDurationWeeks: number;
  readonly weeksSinceEnrollment: number;
  readonly studentName: string;
}

/* ------------------------------------------------------------------ */
/*  AI Work Pace Analysis                                              */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are an AI learning pace analyzer for a Virtual Assistant training program.

You will receive a student's learning pace metrics and course context. Analyze their work pace and provide actionable insights.

Determine the student's pace status:
- "ahead" — completing lessons/quizzes faster than the expected schedule
- "on_track" — progressing at or near the expected rate
- "behind" — falling behind the expected schedule
- "at_risk" — significantly behind with recent inactivity

Consider these factors:
1. Lessons completed vs expected (based on weeks enrolled and course duration)
2. Consistency (attendance rate, streaks, active days)
3. Recent activity trend (last few weeks vs earlier weeks)
4. Days since last activity (high = risk)

Provide:
- **pace**: one of "ahead", "on_track", "behind", "at_risk"
- **summary**: 2-3 sentence overview of their learning velocity
- **strengths**: 2-4 positive observations about their study habits
- **suggestions**: 2-4 actionable recommendations to improve or maintain pace
- **recommendedSchedule**: A brief recommended weekly study schedule (e.g., "Study 3 lessons Mon/Wed/Fri, take quizzes on weekends")
- **projectedCompletionDate**: Estimated date they will finish the course at current pace (ISO date string YYYY-MM-DD)

Respond with a JSON object matching this exact structure:
{
  "pace": "ahead" | "on_track" | "behind" | "at_risk",
  "summary": "string",
  "strengths": ["string"],
  "suggestions": ["string"],
  "recommendedSchedule": "string",
  "projectedCompletionDate": "YYYY-MM-DD"
}`;

export interface WorkPaceResult {
  readonly metrics: WorkPaceMetrics;
  readonly analysis: WorkPaceAnalysis;
}

export async function analyzeWorkPace(
  studentId: string,
): Promise<WorkPaceResult> {
  const metricsWithContext = await calculateMetrics(studentId);

  const {
    courseContext,
    ...metrics
  } = metricsWithContext;

  const expectedLessonsPerWeek =
    courseContext.courseDurationWeeks > 0
      ? (courseContext.totalLessons / courseContext.courseDurationWeeks).toFixed(1)
      : "N/A";

  const completionPercent =
    courseContext.totalLessons > 0
      ? Math.round(
          (courseContext.lessonsCompleted / courseContext.totalLessons) * 100,
        )
      : 0;

  const recentWeeks = metrics.weeklyTrend.slice(-4);
  const recentTrendSummary = recentWeeks
    .map(
      (w) =>
        `${w.week}: ${w.lessons} lessons, ${w.quizzes} quizzes, ${w.attendanceDays} attendance days`,
    )
    .join("\n");

  const userPrompt = `Analyze the learning pace for this VA student:

**Student**: ${courseContext.studentName}
**Course**: ${courseContext.courseTitle} (${courseContext.courseSlug})
**Course Duration**: ${courseContext.courseDurationWeeks} weeks
**Weeks Since Enrollment**: ${courseContext.weeksSinceEnrollment}

**Progress**:
- Lessons Completed: ${courseContext.lessonsCompleted}/${courseContext.totalLessons} (${completionPercent}%)
- Expected Pace: ~${expectedLessonsPerWeek} lessons/week

**Pace Metrics**:
- Lessons Per Week: ${metrics.lessonsPerWeek}
- Avg Time Between Lessons: ${metrics.avgTimeBetweenLessons} hours
- Quiz Attempts Per Week: ${metrics.quizAttemptsPerWeek}
- Attendance Rate: ${metrics.attendanceRate}%
- Current Streak: ${metrics.currentStreak} days
- Longest Streak: ${metrics.longestStreak} days
- Total Active Days: ${metrics.totalActiveDays}
- Days Since Last Activity: ${metrics.daysSinceLastActivity}

**Recent Weekly Trend (last 4 weeks)**:
${recentTrendSummary}

Please analyze the student's learning pace and provide recommendations.`;

  const analysis = await generateJsonCompletion<WorkPaceAnalysis>(
    SYSTEM_PROMPT,
    userPrompt,
    { temperature: 0.5, maxTokens: 1024 },
  );

  // Validate pace value
  const validPaces = ["ahead", "on_track", "behind", "at_risk"] as const;
  const sanitizedPace = validPaces.includes(analysis.pace as typeof validPaces[number])
    ? analysis.pace
    : "on_track";

  const sanitizedAnalysis: WorkPaceAnalysis = {
    pace: sanitizedPace,
    summary: analysis.summary || "Analysis complete.",
    strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
    suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
    recommendedSchedule: analysis.recommendedSchedule || "Follow a consistent daily study routine.",
    projectedCompletionDate: analysis.projectedCompletionDate || "Unknown",
  };

  recordAnalysis(studentId);

  return { metrics, analysis: sanitizedAnalysis };
}
