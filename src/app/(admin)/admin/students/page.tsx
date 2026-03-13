import type { Metadata } from "next";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import { listEnrollments } from "@/lib/repositories/enrollment.repository";
import { getPresentNowCount } from "@/lib/repositories/attendance.repository";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Download, Users, UserCheck, ClipboardCheck } from "lucide-react";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import { StudentManagementTabs } from "@/components/admin/StudentManagementTabs";
import type { EnrollmentFilters } from "@/types";
import type { EnrollmentStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Students | HUMI+ Admin" };

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    courseSlug?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const filters: EnrollmentFilters = {
    page: parseInt(params.page ?? "1", 10),
    limit: 20,
    search: params.search,
  };

  if (params.status) filters.status = params.status as EnrollmentStatus;
  if (params.courseSlug) filters.courseSlug = params.courseSlug;

  const [enrollmentResult, totalStudents, presentNow, courses] =
    await Promise.all([
      listEnrollments(filters),
      prisma.student.count(),
      getPresentNowCount(),
      prisma.course.findMany({
        where: { isActive: true },
        select: { id: true, title: true },
        orderBy: { title: "asc" },
      }),
    ]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage active students, enrollments, and attendance
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <a href="/api/admin/export">
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <AnalyticsCard
          title="Total Enrollments"
          value={enrollmentResult.total}
          icon={Users}
          colorClass="text-blue-600 bg-blue-100"
          subtitle="All applications"
        />
        <AnalyticsCard
          title="Active Students"
          value={totalStudents}
          icon={UserCheck}
          colorClass="text-green-600 bg-green-100"
          subtitle="Approved & enrolled"
        />
        <AnalyticsCard
          title="Present Now"
          value={presentNow}
          icon={ClipboardCheck}
          colorClass="text-emerald-600 bg-emerald-100"
          subtitle="Currently clocked in"
        />
      </div>

      {/* Tabbed content */}
      <Suspense
        fallback={
          <div className="h-12 bg-gray-100 rounded animate-pulse mb-6" />
        }
      >
        <StudentManagementTabs
          courses={courses}
          enrollments={enrollmentResult}
        />
      </Suspense>
    </>
  );
}
