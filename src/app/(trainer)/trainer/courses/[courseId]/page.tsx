import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  ClipboardCheck,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarClock,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getTrainerCourseDetail } from "@/lib/repositories/trainer.repository";
import { CourseDetailTabs } from "@/components/trainer/CourseDetailTabs";

export const metadata: Metadata = {
  title: "Course Detail | HUMI+ Trainer Portal",
};
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TrainerCourseDetailPage({
  params,
}: {
  readonly params: Promise<{ courseId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | (typeof session & { user: { id: string; role: string } })["user"]
    | undefined;

  if (!user || user.role !== "trainer") {
    redirect("/trainer/login");
  }

  const { courseId } = await params;
  const detail = await getTrainerCourseDetail(user.id, courseId);

  if (!detail) {
    notFound();
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/trainer/courses"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{detail.title}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {detail.durationWeeks} weeks &middot; {detail.lessons.length} lessons
          &middot; {detail.assignments.length} assignments &middot;{" "}
          {detail.quizzes.length} quizzes
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="bg-blue-100 rounded-lg p-2.5">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {detail.lessons.length}
            </p>
            <p className="text-xs text-gray-500">Lessons</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="bg-amber-100 rounded-lg p-2.5">
            <ClipboardCheck className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {detail.assignments.length}
            </p>
            <p className="text-xs text-gray-500">Assignments</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="bg-green-100 rounded-lg p-2.5">
            <HelpCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {detail.quizzes.length}
            </p>
            <p className="text-xs text-gray-500">Quizzes</p>
          </div>
        </div>
      </div>

      {/* Tabs (client component for interactivity) */}
      <CourseDetailTabs
        lessons={detail.lessons}
        assignments={detail.assignments.map((a) => ({
          ...a,
          dueDate: a.dueDate ? a.dueDate.toISOString() : null,
          createdAt: a.createdAt.toISOString(),
        }))}
        quizzes={detail.quizzes.map((q) => ({
          ...q,
          createdAt: q.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
