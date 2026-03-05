import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Work Pace Analysis response validation                             */
/* ------------------------------------------------------------------ */

export const workPaceAnalysisSchema = z.object({
  pace: z.enum(["ahead", "on_track", "behind", "at_risk"]),
  summary: z.string().min(1),
  strengths: z.array(z.string()),
  suggestions: z.array(z.string()),
  recommendedSchedule: z.string().min(1),
  projectedCompletionDate: z.string().min(1),
});

/* ------------------------------------------------------------------ */
/*  Weekly activity entry                                              */
/* ------------------------------------------------------------------ */

export const weeklyActivitySchema = z.object({
  week: z.string().min(1),
  lessons: z.number().int().min(0),
  quizzes: z.number().int().min(0),
  attendanceDays: z.number().int().min(0),
});

/* ------------------------------------------------------------------ */
/*  Work Pace Metrics                                                  */
/* ------------------------------------------------------------------ */

export const workPaceMetricsSchema = z.object({
  lessonsPerWeek: z.number().min(0),
  avgTimeBetweenLessons: z.number().min(0),
  quizAttemptsPerWeek: z.number().min(0),
  attendanceRate: z.number().min(0).max(100),
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  totalActiveDays: z.number().int().min(0),
  daysSinceLastActivity: z.number().int().min(0),
  weeklyTrend: z.array(weeklyActivitySchema),
});
