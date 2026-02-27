import type {
  Course,
  Enrollment,
  EnrollmentStatus,
  CourseSlug,
  EmploymentStatus,
  ToolFamiliarity,
  Student,
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

export type {
  Course,
  Enrollment,
  EnrollmentStatus,
  CourseSlug,
  EmploymentStatus,
  ToolFamiliarity,
  Student,
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

export interface AnalyticsStats {
  totalEnrollments: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  enrollmentsByCourse: Array<{ slug: CourseSlug; title: string; count: number }>;
  recentEnrollments: number;
}
