import { prisma } from "@/lib/prisma";
import type { Assignment, Submission } from "@prisma/client";

export async function getAssignmentsByCourse(courseId: string) {
  return prisma.assignment.findMany({
    where: { courseId, isPublished: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
  return prisma.assignment.findUnique({ where: { id } });
}

export async function getAllAssignmentsByCourse(courseId: string) {
  return prisma.assignment.findMany({
    where: { courseId },
    include: { _count: { select: { submissions: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function createAssignment(data: {
  courseId: string;
  title: string;
  instructions: string;
  dueDate?: Date;
  maxPoints?: number;
  isPublished?: boolean;
}): Promise<Assignment> {
  return prisma.assignment.create({ data });
}

export async function getStudentSubmission(
  assignmentId: string,
  studentId: string
): Promise<Submission | null> {
  return prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId } },
  });
}

export async function createSubmission(data: {
  assignmentId: string;
  studentId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
}): Promise<Submission> {
  return prisma.submission.create({ data });
}

export async function getPendingSubmissions() {
  return prisma.submission.findMany({
    where: { status: "PENDING" },
    include: {
      student: { select: { name: true, email: true } },
      assignment: { select: { title: true, courseId: true } },
    },
    orderBy: { submittedAt: "asc" },
  });
}

export async function gradeSubmission(
  submissionId: string,
  grade: number,
  feedback: string
): Promise<Submission> {
  return prisma.submission.update({
    where: { id: submissionId },
    data: { grade, feedback, status: "GRADED", gradedAt: new Date() },
  });
}
