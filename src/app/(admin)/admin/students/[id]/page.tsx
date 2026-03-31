import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getStudentDetail } from "@/lib/repositories/student-management.repository";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentDetailTabs } from "@/components/admin/StudentDetailTabs";

/* ------------------------------------------------------------------ */
/*  Metadata                                                            */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = { title: "Student Detail | Humi Hub Admin" };

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default async function StudentDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab } = await searchParams;
  const student = await getStudentDetail(id);

  if (!student) notFound();

  return (
    <>
      {/* Back button + header */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 mb-4">
          <Link href="/admin/students">
            <ArrowLeft className="h-4 w-4" /> Back to Students
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-gray-500 text-sm">{student.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-full px-3 py-1">
              <BookOpen className="h-3.5 w-3.5" />
              {student.course.title}
            </span>
            <span className="text-xs text-gray-400">
              Enrolled {formatDate(student.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs — wrapped in Suspense for URL-based tab param */}
      <Suspense
        fallback={<div className="h-12 bg-slate-50 rounded-xl animate-pulse mb-6" />}
      >
        <StudentDetailTabs student={student} initialTab={tab} />
      </Suspense>
    </>
  );
}
