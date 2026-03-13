import { prisma } from "@/lib/prisma";
import type { CourseSlug } from "@/types";
import type { JobPostingRecord, JobMatchRecord } from "@/lib/types/ai.types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CreateJobPostingInput {
  readonly title: string;
  readonly company: string;
  readonly description: string;
  readonly requirements: ReadonlyArray<string>;
  readonly skills: ReadonlyArray<string>;
  readonly courseSlug?: CourseSlug | null;
  readonly location: string;
  readonly type: string;
  readonly salaryRange?: string | null;
}

interface UpdateJobPostingInput {
  readonly title?: string;
  readonly company?: string;
  readonly description?: string;
  readonly requirements?: ReadonlyArray<string>;
  readonly skills?: ReadonlyArray<string>;
  readonly courseSlug?: CourseSlug | null;
  readonly location?: string;
  readonly type?: string;
  readonly salaryRange?: string | null;
  readonly isActive?: boolean;
}

interface JobPostingFilters {
  readonly isActive?: boolean;
  readonly courseSlug?: CourseSlug;
}

export interface StudentProfileForMatching {
  readonly name: string;
  readonly courseSlug: string;
  readonly courseTitle: string;
  readonly quizAverage: number;
  readonly assignmentAverage: number;
  readonly badgeNames: ReadonlyArray<string>;
  readonly totalPoints: number;
  readonly technicalSkills: ReadonlyArray<string>;
  readonly toolsFamiliarity: ReadonlyArray<string>;
  readonly lessonsCompleted: number;
  readonly totalLessons: number;
}

/* ------------------------------------------------------------------ */
/*  Job Posting — Read                                                 */
/* ------------------------------------------------------------------ */

export async function getJobPostings(
  filters?: JobPostingFilters,
): Promise<ReadonlyArray<JobPostingRecord>> {
  const where: Record<string, unknown> = {};

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }
  if (filters?.courseSlug) {
    where.courseSlug = filters.courseSlug;
  }

  const postings = await prisma.jobPosting.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return postings;
}

export async function getJobPostingById(
  id: string,
): Promise<JobPostingRecord | null> {
  const posting = await prisma.jobPosting.findUnique({
    where: { id },
  });

  return posting;
}

/* ------------------------------------------------------------------ */
/*  Job Posting — Write                                                */
/* ------------------------------------------------------------------ */

export async function createJobPosting(
  data: CreateJobPostingInput,
): Promise<JobPostingRecord> {
  const posting = await prisma.jobPosting.create({
    data: {
      title: data.title,
      company: data.company,
      description: data.description,
      requirements: [...data.requirements],
      skills: [...data.skills],
      courseSlug: data.courseSlug ?? null,
      location: data.location,
      type: data.type,
      salaryRange: data.salaryRange ?? null,
    },
  });

  return posting;
}

export async function updateJobPosting(
  id: string,
  data: UpdateJobPostingInput,
): Promise<JobPostingRecord> {
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.company !== undefined) updateData.company = data.company;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.requirements !== undefined)
    updateData.requirements = [...data.requirements];
  if (data.skills !== undefined) updateData.skills = [...data.skills];
  if (data.courseSlug !== undefined) updateData.courseSlug = data.courseSlug;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.salaryRange !== undefined) updateData.salaryRange = data.salaryRange;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const posting = await prisma.jobPosting.update({
    where: { id },
    data: updateData,
  });

  return posting;
}

export async function deleteJobPosting(id: string): Promise<void> {
  await prisma.jobMatch.deleteMany({ where: { jobPostingId: id } });
  await prisma.jobPosting.delete({ where: { id } });
}

/* ------------------------------------------------------------------ */
/*  Job Match — Read                                                   */
/* ------------------------------------------------------------------ */

export async function getStudentMatches(
  studentId: string,
): Promise<ReadonlyArray<JobMatchRecord>> {
  const matches = await prisma.jobMatch.findMany({
    where: { studentId },
    include: { jobPosting: true },
    orderBy: { matchScore: "desc" },
  });

  return matches;
}

/* ------------------------------------------------------------------ */
/*  Job Match — Write                                                  */
/* ------------------------------------------------------------------ */

export async function saveMatch(
  studentId: string,
  jobPostingId: string,
  matchScore: number,
  aiReasoning: string,
): Promise<JobMatchRecord> {
  const match = await prisma.jobMatch.upsert({
    where: {
      studentId_jobPostingId: { studentId, jobPostingId },
    },
    update: {
      matchScore,
      aiReasoning,
      matchedAt: new Date(),
    },
    create: {
      studentId,
      jobPostingId,
      matchScore,
      aiReasoning,
    },
    include: { jobPosting: true },
  });

  return match;
}

/* ------------------------------------------------------------------ */
/*  Student data aggregation for AI matching                           */
/* ------------------------------------------------------------------ */

export async function getStudentProfileForMatching(
  studentId: string,
): Promise<StudentProfileForMatching | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      name: true,
      enrollment: {
        select: {
          courseId: true,
          technicalSkills: true,
          toolsFamiliarity: true,
          course: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!student) return null;

  const courseId = student.enrollment.courseId;

  const [
    quizAgg,
    assignmentAgg,
    lessonsCompleted,
    totalLessons,
    badges,
    pointsAgg,
  ] = await Promise.all([
    prisma.quizAttempt.aggregate({
      where: { studentId, quiz: { courseId } },
      _avg: { score: true },
    }),

    prisma.submission.aggregate({
      where: { studentId, assignment: { courseId }, status: "GRADED" },
      _avg: { grade: true },
    }),

    prisma.lessonCompletion.count({
      where: { studentId, lesson: { courseId, isPublished: true } },
    }),

    prisma.lesson.count({
      where: { courseId, isPublished: true },
    }),

    prisma.studentBadge.findMany({
      where: { studentId },
      select: { badge: { select: { name: true } } },
    }),

    prisma.pointTransaction.aggregate({
      where: { studentId },
      _sum: { points: true },
    }),
  ]);

  return {
    name: student.name,
    courseSlug: student.enrollment.course.slug,
    courseTitle: student.enrollment.course.title,
    quizAverage: Math.round(quizAgg._avg.score ?? 0),
    assignmentAverage: Math.round(assignmentAgg._avg.grade ?? 0),
    badgeNames: badges.map((b) => b.badge.name),
    totalPoints: pointsAgg._sum.points ?? 0,
    technicalSkills: student.enrollment.technicalSkills,
    toolsFamiliarity: student.enrollment.toolsFamiliarity,
    lessonsCompleted,
    totalLessons,
  };
}

/* ------------------------------------------------------------------ */
/*  Rate limit — last match timestamp                                  */
/* ------------------------------------------------------------------ */

export async function getLastMatchTimestamp(
  studentId: string,
): Promise<Date | null> {
  const latest = await prisma.jobMatch.findFirst({
    where: { studentId },
    orderBy: { matchedAt: "desc" },
    select: { matchedAt: true },
  });

  return latest?.matchedAt ?? null;
}
