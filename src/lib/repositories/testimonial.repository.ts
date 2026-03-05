import { prisma } from "@/lib/prisma";
import type { Testimonial } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────

interface CreateTestimonialData {
  readonly name: string;
  readonly role: string;
  readonly company: string;
  readonly content: string;
  readonly rating: number;
  readonly avatarUrl?: string | null;
  readonly isPublished?: boolean;
  readonly displayOrder?: number;
}

interface UpdateTestimonialData {
  readonly name?: string;
  readonly role?: string;
  readonly company?: string;
  readonly content?: string;
  readonly rating?: number;
  readonly avatarUrl?: string | null;
  readonly isPublished?: boolean;
  readonly displayOrder?: number;
}

// ── Public ─────────────────────────────────────────────────────────

export async function getPublishedTestimonials(): Promise<
  ReadonlyArray<Testimonial>
> {
  return prisma.testimonial.findMany({
    where: { isPublished: true },
    orderBy: { displayOrder: "asc" },
  });
}

// ── Admin: CRUD ────────────────────────────────────────────────────

export async function getAllTestimonials(): Promise<
  ReadonlyArray<Testimonial>
> {
  return prisma.testimonial.findMany({
    orderBy: { displayOrder: "asc" },
  });
}

export async function getTestimonialById(
  id: string,
): Promise<Testimonial | null> {
  return prisma.testimonial.findUnique({
    where: { id },
  });
}

export async function createTestimonial(
  data: CreateTestimonialData,
): Promise<Testimonial> {
  return prisma.testimonial.create({
    data: {
      name: data.name,
      role: data.role,
      company: data.company,
      content: data.content,
      rating: data.rating,
      avatarUrl: data.avatarUrl ?? null,
      isPublished: data.isPublished ?? false,
      displayOrder: data.displayOrder ?? 0,
    },
  });
}

export async function updateTestimonial(
  id: string,
  data: UpdateTestimonialData,
): Promise<Testimonial> {
  return prisma.testimonial.update({
    where: { id },
    data,
  });
}

export async function deleteTestimonial(id: string): Promise<void> {
  await prisma.testimonial.delete({ where: { id } });
}
