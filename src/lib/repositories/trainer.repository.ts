import { prisma } from "@/lib/prisma";
import type { Trainer, CourseTrainer } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────

interface CreateTrainerData {
  readonly name: string;
  readonly email: string;
  readonly phone?: string | null;
  readonly bio?: string | null;
  readonly photoUrl?: string | null;
  readonly specializations?: ReadonlyArray<string>;
  readonly credentials?: string | null;
  readonly certifications?: ReadonlyArray<string>;
  readonly industryExperience?: string | null;
  readonly yearsOfExperience?: number;
}

interface UpdateTrainerData {
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string | null;
  readonly bio?: string | null;
  readonly photoUrl?: string | null;
  readonly specializations?: ReadonlyArray<string>;
  readonly isActive?: boolean;
  readonly credentials?: string | null;
  readonly certifications?: ReadonlyArray<string>;
  readonly industryExperience?: string | null;
  readonly yearsOfExperience?: number;
  readonly accessGranted?: boolean;
}

interface TrainerWithCourseCount extends Trainer {
  readonly _count: { readonly courses: number; readonly students: number };
}

interface CourseDetail {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly isActive: boolean;
}

interface CourseTrainerWithCourse extends CourseTrainer {
  readonly course: CourseDetail;
}

interface TrainerWithCourses extends Trainer {
  readonly courses: ReadonlyArray<CourseTrainerWithCourse>;
}

// ── Queries ─────────────────────────────────────────────────────────

export async function getAllTrainers(): Promise<
  ReadonlyArray<TrainerWithCourseCount>
> {
  return prisma.trainer.findMany({
    include: {
      _count: { select: { courses: true, students: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getAllTrainersByTenant(tenantId: string): Promise<ReadonlyArray<TrainerWithCourseCount>> {
  return prisma.trainer.findMany({
    where: {
      tenantAssignments: { some: { tenantId, isActive: true } },
    },
    include: {
      _count: { select: { courses: true, students: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getActiveTrainersByCourse(
  courseId: string,
): Promise<ReadonlyArray<Trainer>> {
  const courseTrainers = await prisma.courseTrainer.findMany({
    where: { courseId },
    include: { trainer: true },
  });
  return courseTrainers
    .filter((ct) => ct.trainer.isActive)
    .map((ct) => ct.trainer);
}

export async function getActiveTrainers(): Promise<ReadonlyArray<Trainer>> {
  return prisma.trainer.findMany({
    where: { isActive: true },
    orderBy: [{ averageRating: "desc" }, { name: "asc" }],
  });
}

export async function getTrainerById(
  id: string,
): Promise<TrainerWithCourses | null> {
  return prisma.trainer.findUnique({
    where: { id },
    include: {
      courses: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              isActive: true,
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      },
    },
  });
}

export async function getTrainerByEmail(
  email: string,
): Promise<Trainer | null> {
  return prisma.trainer.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function getTrainersByCourse(
  courseId: string,
): Promise<ReadonlyArray<CourseTrainer & { readonly trainer: Trainer }>> {
  return prisma.courseTrainer.findMany({
    where: { courseId },
    include: { trainer: true },
    orderBy: { assignedAt: "desc" },
  });
}

// ── Mutations ───────────────────────────────────────────────────────

export async function createTrainer(
  data: CreateTrainerData,
): Promise<Trainer> {
  return prisma.trainer.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      bio: data.bio ?? null,
      photoUrl: data.photoUrl ?? null,
      specializations: data.specializations
        ? [...data.specializations]
        : [],
      credentials: data.credentials ?? null,
      certifications: data.certifications
        ? [...data.certifications]
        : [],
      industryExperience: data.industryExperience ?? null,
      yearsOfExperience: data.yearsOfExperience ?? 0,
    },
  });
}

export async function updateTrainer(
  id: string,
  data: UpdateTrainerData,
): Promise<Trainer> {
  const updatePayload: Record<string, unknown> = {};

  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.email !== undefined) updatePayload.email = data.email;
  if (data.phone !== undefined) updatePayload.phone = data.phone;
  if (data.bio !== undefined) updatePayload.bio = data.bio;
  if (data.photoUrl !== undefined) updatePayload.photoUrl = data.photoUrl;
  if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
  if (data.credentials !== undefined) updatePayload.credentials = data.credentials;
  if (data.industryExperience !== undefined) updatePayload.industryExperience = data.industryExperience;
  if (data.yearsOfExperience !== undefined) updatePayload.yearsOfExperience = data.yearsOfExperience;
  if (data.accessGranted !== undefined) updatePayload.accessGranted = data.accessGranted;
  if (data.specializations !== undefined) {
    updatePayload.specializations = [...data.specializations];
  }
  if (data.certifications !== undefined) {
    updatePayload.certifications = [...data.certifications];
  }

  return prisma.trainer.update({
    where: { id },
    data: updatePayload,
  });
}

export async function deleteTrainer(id: string): Promise<Trainer> {
  return prisma.trainer.update({
    where: { id },
    data: { isActive: false, accessGranted: false },
  });
}

// ── Course assignments ──────────────────────────────────────────────

export async function assignTrainerToCourse(
  trainerId: string,
  courseId: string,
  role?: string,
): Promise<CourseTrainer> {
  return prisma.courseTrainer.create({
    data: {
      trainerId,
      courseId,
      role: role ?? "instructor",
    },
  });
}

export async function removeTrainerFromCourse(
  trainerId: string,
  courseId: string,
): Promise<CourseTrainer> {
  return prisma.courseTrainer.delete({
    where: {
      courseId_trainerId: { courseId, trainerId },
    },
  });
}

// ── Trainer course queries ────────────────────────────────────────────

export async function getTrainerCourses(trainerId: string) {
  // Get unique courses from trainer's assigned schedules
  const schedules = await prisma.schedule.findMany({
    where: { trainerId },
    select: { courseId: true },
    distinct: ["courseId"],
  });

  const courseIds = schedules.map((s) => s.courseId);
  if (courseIds.length === 0) return [];

  return prisma.course.findMany({
    where: { id: { in: courseIds } },
    include: {
      _count: {
        select: { lessons: true, assignments: true, quizzes: true },
      },
      schedules: {
        where: { trainerId },
        include: { _count: { select: { students: true } } },
      },
    },
    orderBy: { title: "asc" },
  });
}

export async function getTrainerCourseDetail(
  trainerId: string,
  courseId: string,
) {
  // Verify trainer is assigned to this course via schedule
  const schedule = await prisma.schedule.findFirst({
    where: { trainerId, courseId },
  });
  if (!schedule) return null;

  const [course, lessons, assignments, quizzes] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, slug: true, description: true, durationWeeks: true },
    }),
    prisma.lesson.findMany({
      where: { courseId },
      orderBy: [{ tier: "asc" }, { order: "asc" }],
      select: {
        id: true,
        title: true,
        order: true,
        durationMin: true,
        isPublished: true,
        tier: true,
      },
    }),
    prisma.assignment.findMany({
      where: { courseId },
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { submissions: true } },
        submissions: {
          where: { status: "PENDING" },
          select: { id: true },
        },
      },
    }),
    prisma.quiz.findMany({
      where: { courseId },
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
    }),
  ]);

  if (!course) return null;

  return {
    ...course,
    lessons,
    assignments: assignments.map((a) => ({
      id: a.id,
      title: a.title,
      instructions: a.instructions,
      dueDate: a.dueDate,
      maxPoints: a.maxPoints,
      isPublished: a.isPublished,
      createdAt: a.createdAt,
      totalSubmissions: a._count.submissions,
      pendingCount: a.submissions.length,
    })),
    quizzes: quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      passingScore: q.passingScore,
      isPublished: q.isPublished,
      createdAt: q.createdAt,
      questionCount: q._count.questions,
      attemptCount: q._count.attempts,
    })),
  };
}

export async function getPendingSubmissionsForTrainer(trainerId: string) {
  return prisma.submission.findMany({
    where: {
      status: "PENDING",
      student: { trainerId },
    },
    include: {
      student: {
        select: { id: true, name: true, email: true },
      },
      assignment: {
        select: {
          id: true,
          title: true,
          maxPoints: true,
          passingScore: true,
          submissionType: true,
          rubric: true,
          courseId: true,
          course: { select: { title: true } },
          lesson: { select: { title: true } },
        },
      },
    },
    orderBy: { submittedAt: "asc" },
  });
}

// ── Trainer dashboard queries ───────────────────────────────────────

export async function getTrainerDashboardStats(trainerId: string) {
  const [studentCount, scheduleCount, ratingStats] = await Promise.all([
    prisma.student.count({ where: { trainerId } }),
    prisma.schedule.count({ where: { trainerId, status: { in: ["OPEN", "FULL"] } } }),
    prisma.trainerRating.aggregate({
      where: { trainerId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return {
    totalStudents: studentCount,
    activeSchedules: scheduleCount,
    averageRating: ratingStats._avg.rating,
    totalRatings: ratingStats._count.rating,
  };
}

export async function getTrainerSchedules(trainerId: string) {
  return prisma.schedule.findMany({
    where: { trainerId },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      _count: { select: { students: true } },
    },
    orderBy: { startDate: "asc" },
  });
}

export async function getTrainerStudents(trainerId: string) {
  return prisma.student.findMany({
    where: { trainerId },
    include: {
      enrollment: {
        select: {
          fullName: true,
          email: true,
          course: { select: { title: true, slug: true } },
        },
      },
      _count: { select: { completions: true, submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
