/* ------------------------------------------------------------------ */
/*  Career Readiness Score                                             */
/* ------------------------------------------------------------------ */

export interface CareerReadinessScoreData {
  readonly communication: number;
  readonly accuracy: number;
  readonly speed: number;
  readonly reliability: number;
  readonly technicalSkills: number;
  readonly professionalism: number;
  readonly overallScore: number;
  readonly aiSummary: string;
}

export interface CareerReadinessScoreRecord extends CareerReadinessScoreData {
  readonly id: string;
  readonly studentId: string;
  readonly evaluatedAt: Date;
}

export interface StudentMetricsForScoring {
  readonly studentName: string;
  readonly courseTitle: string;
  readonly courseSlug: string;
  readonly quizAverage: number;
  readonly assignmentAverage: number;
  readonly lessonsCompleted: number;
  readonly totalLessons: number;
  readonly attendanceDays: number;
  readonly forumPosts: number;
  readonly badgesEarned: number;
  readonly totalPoints: number;
  readonly daysSinceEnrollment: number;
}

/* ------------------------------------------------------------------ */
/*  AI Assessment (Submission Evaluation)                              */
/* ------------------------------------------------------------------ */

export interface AIAssessmentResult {
  readonly score: number;
  readonly feedback: string;
  readonly strengths: ReadonlyArray<string>;
  readonly improvements: ReadonlyArray<string>;
  readonly skillsAssessed: ReadonlyArray<string>;
}

export interface SubmissionForAssessment {
  readonly submissionId: string;
  readonly fileName: string;
  readonly fileSize: number;
  readonly status: string;
  readonly grade: number | null;
  readonly feedback: string | null;
  readonly assignmentTitle: string;
  readonly assignmentInstructions: string;
  readonly courseTitle: string;
  readonly studentName: string;
}

/* ------------------------------------------------------------------ */
/*  AI Admin Performance Insights                                      */
/* ------------------------------------------------------------------ */

export interface PerformanceOverviewData {
  readonly totalStudents: number;
  readonly totalCourses: number;
  readonly topPerformers: ReadonlyArray<TopPerformer>;
  readonly atRiskStudents: ReadonlyArray<AtRiskStudent>;
  readonly courseMetrics: ReadonlyArray<CourseMetric>;
}

export interface TopPerformer {
  readonly studentId: string;
  readonly studentName: string;
  readonly courseTitle: string;
  readonly totalPoints: number;
  readonly quizAverage: number;
  readonly badgeCount: number;
}

export interface AtRiskStudent {
  readonly studentId: string;
  readonly studentName: string;
  readonly courseTitle: string;
  readonly daysSinceActive: number;
  readonly lessonsCompleted: number;
  readonly totalLessons: number;
}

export interface CourseMetric {
  readonly courseId: string;
  readonly courseTitle: string;
  readonly enrolledCount: number;
  readonly avgQuizScore: number;
  readonly completionRate: number;
  readonly submissionRate: number;
}

export interface AIPerformanceInsights {
  readonly platformSummary: string;
  readonly topPerformers: ReadonlyArray<TopPerformer>;
  readonly atRiskStudents: ReadonlyArray<AtRiskStudentWithRecommendation>;
  readonly skillGaps: ReadonlyArray<SkillGap>;
  readonly recommendations: ReadonlyArray<string>;
  readonly generatedAt: string;
}

export interface AtRiskStudentWithRecommendation extends AtRiskStudent {
  readonly recommendation: string;
}

export interface SkillGap {
  readonly courseTitle: string;
  readonly gap: string;
  readonly severity: "low" | "medium" | "high";
}

/* ------------------------------------------------------------------ */
/*  AI Interview Session                                               */
/* ------------------------------------------------------------------ */

export interface InterviewQuestion {
  readonly question: string;
  readonly answer: string | null;
  readonly aiFollowUp: string | null;
  readonly score: number | null;
}

export interface InterviewSessionRecord {
  readonly id: string;
  readonly studentId: string;
  readonly role: string;
  readonly courseSlug: string;
  readonly questions: ReadonlyArray<InterviewQuestion>;
  readonly status: string;
  readonly overallScore: number | null;
  readonly communicationScore: number | null;
  readonly knowledgeScore: number | null;
  readonly problemSolvingScore: number | null;
  readonly professionalismScore: number | null;
  readonly aiFeedback: string | null;
  readonly createdAt: Date;
  readonly completedAt: Date | null;
}

/* ------------------------------------------------------------------ */
/*  AI Work Pace Monitor                                               */
/* ------------------------------------------------------------------ */

export interface WorkPaceMetrics {
  readonly lessonsPerWeek: number;
  readonly avgTimeBetweenLessons: number;
  readonly quizAttemptsPerWeek: number;
  readonly attendanceRate: number;
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly totalActiveDays: number;
  readonly daysSinceLastActivity: number;
  readonly weeklyTrend: ReadonlyArray<WeeklyActivity>;
}

export interface WeeklyActivity {
  readonly week: string;
  readonly lessons: number;
  readonly quizzes: number;
  readonly attendanceDays: number;
}

export interface WorkPaceAnalysis {
  readonly pace: "ahead" | "on_track" | "behind" | "at_risk";
  readonly summary: string;
  readonly strengths: ReadonlyArray<string>;
  readonly suggestions: ReadonlyArray<string>;
  readonly recommendedSchedule: string;
  readonly projectedCompletionDate: string;
}

/* ------------------------------------------------------------------ */
/*  AI Job Matching                                                    */
/* ------------------------------------------------------------------ */

export interface JobPostingRecord {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly description: string;
  readonly requirements: ReadonlyArray<string>;
  readonly skills: ReadonlyArray<string>;
  readonly courseSlug: string | null;
  readonly location: string;
  readonly type: string;
  readonly salaryRange: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

export interface JobMatchRecord {
  readonly id: string;
  readonly studentId: string;
  readonly jobPostingId: string;
  readonly matchScore: number;
  readonly aiReasoning: string;
  readonly matchedAt: Date;
  readonly jobPosting: JobPostingRecord;
}

/* ------------------------------------------------------------------ */
/*  AI Control Tower (Admin Automation)                                */
/* ------------------------------------------------------------------ */

export interface DropoutRiskStudent {
  readonly studentId: string;
  readonly studentName: string;
  readonly courseTitle: string;
  readonly riskScore: number;
  readonly riskFactors: ReadonlyArray<string>;
  readonly suggestedAction: string;
}

export interface CompletionPrediction {
  readonly courseTitle: string;
  readonly predictedCompletionRate: number;
  readonly currentCompletionRate: number;
  readonly trend: "improving" | "stable" | "declining";
}

export interface AutomationInsights {
  readonly summary: string;
  readonly dropoutRiskStudents: ReadonlyArray<DropoutRiskStudent>;
  readonly completionPredictions: ReadonlyArray<CompletionPrediction>;
  readonly automationSuggestions: ReadonlyArray<AutomationSuggestion>;
  readonly generatedAt: string;
}

export interface AutomationSuggestion {
  readonly trigger: string;
  readonly action: string;
  readonly priority: "high" | "medium" | "low";
  readonly affectedStudents: number;
}
