import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CourseDetailPage } from "@/components/public/CourseDetailPage";

export const metadata: Metadata = {
  title: "US Bookkeeping Virtual Assistant Course",
  description:
    "Master US bookkeeping standards. Learn QuickBooks, bank reconciliation, payroll basics, and financial reporting.",
};

export default async function USBookkeepingVAPage() {
  const course = await prisma.course.findUnique({ where: { slug: "US_BOOKKEEPING_VA" } });
  if (!course) return notFound();
  return <CourseDetailPage course={course} />;
}
