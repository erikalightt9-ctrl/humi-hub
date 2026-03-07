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
}

interface UpdateTrainerData {
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string | null;
  readonly bio?: string | null;
  readonly photoUrl?: string | null;
  readonly specializations?: ReadonlyArray<string>;
  readonly isActive?: boolean;
}

interface TrainerWithCourseCount extends Trainer {
  readonly _count: { readonly courses: number };
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
      _count: { select: { courses: true } },
    },
    orderBy: { name: "asc" },
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
  if (data.specializations !== undefined) {
    updatePayload.specializations = [...data.specializations];
  }

  return prisma.trainer.update({
    where: { id },
    data: updatePayload,
  });
}

export async function deleteTrainer(id: string): Promise<Trainer> {
  return prisma.trainer.update({
    where: { id },
    data: { isActive: false },
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
