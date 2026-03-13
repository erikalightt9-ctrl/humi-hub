import type {
  Course,
  Enrollment,
  EnrollmentStatus,
  EmploymentStatus,
  ToolFamiliarity,
  Student,
  StudentPaymentStatus,
  Schedule,
  ScheduleStatus,
  Lesson,
  Quiz,
  QuizQuestion,
  Certificate,
  ForumThread,
  ForumPost,
  Assignment,
  Submission,
  Badge,
  StudentBadge,
  PointTransaction,
  QuestionType,
  SubmissionStatus,
  BadgeType,
} from "@prisma/client";

// CourseSlug is now a flexible string (no longer a Prisma enum)
export type CourseSlug = string;

export type {
  Course,
  Enrollment,
  EnrollmentStatus,
  EmploymentStatus,
  ToolFamiliarity,
  Student,
  StudentPaymentStatus,
  Schedule,
  ScheduleStatus,
  Lesson,
  Quiz,
  QuizQuestion,
  Certificate,
  ForumThread,
  ForumPost,
  Assignment,
  Submission,
  Badge,
  StudentBadge,
  PointTransaction,
  QuestionType,
  SubmissionStatus,
  BadgeType,
};

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = null> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface EnrollmentFilters {
  courseSlug?: CourseSlug;
  status?: EnrollmentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EnrolleeFilters {
  courseSlug?: CourseSlug;
  paymentStatus?: StudentPaymentStatus;
  accessGranted?: boolean;
  batch?: string;
  scheduleId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ScheduleFilters {
  courseSlug?: CourseSlug;
  status?: ScheduleStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AnalyticsStats {
  totalEnrollments: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  enrollmentsByCourse: Array<{ slug: CourseSlug; title: string; count: number }>;
  recentEnrollments: number;
}
