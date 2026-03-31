export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CourseDetailPage } from "@/components/public/CourseDetailPage";
import { getPreviewLessons } from "@/lib/repositories/lesson.repository";

/* ------------------------------------------------------------------ */
/*  Slug → DB slug mapping                                             */
/*  URL uses kebab-case, DB uses UPPER_SNAKE_CASE                      */
/* ------------------------------------------------------------------ */

function urlSlugToDbSlug(urlSlug: string): string {
  return urlSlug.toUpperCase().replace(/-/g, "_");
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug: urlSlugToDbSlug(slug) },
  });

  if (!course) {
    return { title: "Program Not Found | HUMI Hub" };
  }

  return {
    title: `${course.title} | HUMI Hub`,
    description: course.description.slice(0, 160),
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ProgramPage({
  params,
}: {
  readonly params: Promise<{ readonly slug: string }>;
}) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug: urlSlugToDbSlug(slug) },
  });

  if (!course) return notFound();

  const previewLessons = await getPreviewLessons(course.id);

  return <CourseDetailPage course={course} previewLessons={previewLessons} />;
}
