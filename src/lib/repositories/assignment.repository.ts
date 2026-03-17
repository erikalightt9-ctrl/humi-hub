import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { Assignment, Submission, SubmissionType } from "@prisma/client";
import { scopeViaCourse, type TenantScope } from "@/lib/tenant-isolation";
// ─── Assignment Queries ────────────────────────────────────────────────────────

export async function getAssignmentsByCourse(courseId: string) {
  return prisma.assignment.findMany({
    where: { courseId, isPublished: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      lesson: { select: { id: true, title: true } },
    },
  });
}

export async function getAssignmentsByLesson(lessonId: string) {
  return prisma.assignment.findMany({
    where: { lessonId, isPublished: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
  return prisma.assignment.findUnique({ where: { id } });
}

export async function getAllAssignmentsByCourse(courseId: string) {
  return prisma.assignment.findMany({
    where: { courseId },
    include: {
      _count: { select: { submissions: true } },
      lesson: { select: { id: true, title: true } },
      module: { select: { id: true, title: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

export async function createAssignment(data: {
  courseId: string;
  lessonId?: string | null;
  moduleId?: string | null;
  title: string;
  description?: string | null;
  instructions: string;
  submissionType?: SubmissionType;
  dueDate?: Date | null;
  startDate?: Date | null;
  maxPoints?: number;
  passingScore?: number;
  allowLateSubmission?: boolean;
  allowResubmission?: boolean;
  maxFileSizeMB?: number;
  allowedFileTypes?: string[];
  rubric?: object | null;
  isPublished?: boolean;
  isRequired?: boolean;
  order?: number;
}): Promise<Assignment> {
  const { rubric, ...rest } = data;
  return prisma.assignment.create({
    data: {
      ...rest,
      rubric: rubric === null ? Prisma.JsonNull : (rubric ?? Prisma.DbNull),
    },
  });
}

export async function updateAssignment(
  id: string,
  data: Partial<{
    lessonId: string | null;
    moduleId: string | null;
    title: string;
    description: string | null;
    instructions: string;
    submissionType: SubmissionType;
    dueDate: Date | null;
    startDate: Date | null;
    maxPoints: number;
    passingScore: number;
    allowLateSubmission: boolean;
    allowResubmission: boolean;
    maxFileSizeMB: number;
    allowedFileTypes: string[];
    rubric: object | null;
    isPublished: boolean;
    isRequired: boolean;
    order: number;
  }>
): Promise<Assignment> {
  const { rubric, moduleId, lessonId, ...rest } = data;
  return prisma.assignment.update({
    where: { id },
    data: {
      ...rest,
      ...(rubric !== undefined && { rubric: rubric === null ? Prisma.JsonNull : rubric }),
      ...(moduleId !== undefined && { moduleId }),
      ...(lessonId !== undefined && { lessonId }),
    },
  });
}

export async function deleteAssignment(id: string): Promise<Assignment> {
  return prisma.assignment.delete({ where: { id } });
}

// ─── Submission Queries ────────────────────────────────────────────────────────

export async function getStudentSubmission(
  assignmentId: string,
  studentId: string
): Promise<Submission | null> {
  return prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId } },
  });
}

export async function upsertSubmission(data: {
  assignmentId: string;
  studentId: string;
  filePath?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  textAnswer?: string | null;
  linkUrl?: string | null;
  taskCompleted?: boolean | null;
}): Promise<Submission> {
  return prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId: data.assignmentId, studentId: data.studentId } },
    update: {
      ...data,
      status: "PENDING",
      submittedAt: new Date(),
      grade: null,
      feedback: null,
      gradedAt: null,
      gradedBy: null,
      rubricScores: undefined,
    },
    create: { ...data },
  });
}

export async function createSubmission(data: {
  assignmentId: string;
  studentId: string;
  filePath?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  textAnswer?: string | null;
  linkUrl?: string | null;
  taskCompleted?: boolean | null;
}): Promise<Submission> {
  return prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId: data.assignmentId, studentId: data.studentId } },
    update: {
      ...data,
      status: "PENDING",
      submittedAt: new Date(),
      grade: null,
      feedback: null,
      gradedAt: null,
      gradedBy: null,
      rubricScores: undefined,
    },
    create: { ...data },
  });
}

export async function getPendingSubmissions() {
  return prisma.submission.findMany({
    where: { status: "PENDING" },
    include: {
      student: { select: { name: true, email: true } },
      assignment: {
        select: {
          title: true,
          courseId: true,
          maxPoints: true,
          passingScore: true,
          rubric: true,
          submissionType: true,
          lesson: { select: { title: true } },
        },
      },
    },
    orderBy: { submittedAt: "asc" },
  });
}

export async function getAllSubmissions(filters?: {
  status?: string;
  courseId?: string;
  scope?: TenantScope;
}) {
  return prisma.submission.findMany({
    where: {
      ...(filters?.status && { status: filters.status as "PENDING" | "GRADED" | "RETURNED" }),
      ...(filters?.scope && { assignment: { course: { tenantId: filters.scope } } }),
    },
    include: {
      student: { select: { name: true, email: true } },
      assignment: {
        select: {
          title: true,
          courseId: true,
          maxPoints: true,
          passingScore: true,
          rubric: true,
          submissionType: true,
          lesson: { select: { title: true } },
          course: { select: { title: true } },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });
}

export async function gradeSubmission(
  submissionId: string,
  grade: number,
  feedback: string,
  gradedBy?: string,
  rubricScores?: object
): Promise<Submission> {
  return prisma.submission.update({
    where: { id: submissionId },
    data: {
      grade,
      feedback,
      status: "GRADED",
      gradedAt: new Date(),
      ...(gradedBy && { gradedBy }),
      ...(rubricScores && { rubricScores }),
    },
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAssignmentAnalytics(scope: TenantScope = null) {
  const assignmentFilter = scopeViaCourse(scope);
  const submissionFilter = scope ? { assignment: { course: { tenantId: scope } } } : {};

  const [total, submissions, pending, graded] = await Promise.all([
    prisma.assignment.count({ where: { isPublished: true, ...assignmentFilter } }),
    prisma.submission.count({ where: submissionFilter }),
    prisma.submission.count({ where: { status: "PENDING", ...submissionFilter } }),
    prisma.submission.count({ where: { status: "GRADED", ...submissionFilter } }),
  ]);

  const completionRate = submissions > 0 ? Math.round((graded / submissions) * 100) : 0;

  return { total, submissions, pending, graded, completionRate };
}

export async function getSubmissionsByAssignment(assignmentId: string) {
  return prisma.submission.findMany({
    where: { assignmentId },
    include: { student: { select: { name: true, email: true } } },
    orderBy: { submittedAt: "desc" },
  });
}
