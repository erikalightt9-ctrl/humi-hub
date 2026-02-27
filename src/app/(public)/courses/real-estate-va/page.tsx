import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CourseDetailPage } from "@/components/public/CourseDetailPage";

export const metadata: Metadata = {
  title: "Real Estate Virtual Assistant Course",
  description:
    "Launch your Real Estate VA career. Master property research, MLS, CRM tools, and transaction coordination.",
};

export default async function RealEstateVAPage() {
  const course = await prisma.course.findUnique({ where: { slug: "REAL_ESTATE_VA" } });
  if (!course) return notFound();
  return <CourseDetailPage course={course} />;
}
