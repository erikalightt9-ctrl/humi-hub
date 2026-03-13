import type { Metadata } from "next";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import { CalendarClock, Users, Inbox, Clock } from "lucide-react";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import { ScheduleFilters } from "@/components/admin/ScheduleFilters";
import { SchedulePageClient } from "@/components/admin/SchedulePageClient";
import { Pagination } from "@/components/admin/Pagination";
import { listSchedules, getScheduleStats } from "@/lib/repositories/schedule.repository";
import { prisma } from "@/lib/prisma";
import type { ScheduleFilters as ScheduleFilterType } from "@/types";
import type { ScheduleStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Schedules | HUMI Admin" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    courseSlug?: string;
    status?: string;
  }>;
}

export default async function SchedulesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const filters: ScheduleFilterType = {
    page: parseInt(params.page ?? "1", 10),
    limit: 20,
    search: params.search,
    courseSlug: params.courseSlug,
    status: params.status as ScheduleStatus | undefined,
  };

  const [schedules, stats, courses] = await Promise.all([
    listSchedules(filters),
    getScheduleStats(),
    prisma.course.findMany({
      where: { isActive: true },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <AnalyticsCard
          title="Active Batches"
          value={stats.totalActive}
          icon={CalendarClock}
          colorClass="text-blue-600 bg-blue-100"
          subtitle="Open + Full"
        />
        <AnalyticsCard
          title="Students in Batches"
          value={stats.totalStudents}
          icon={Users}
          colorClass="text-indigo-600 bg-indigo-100"
          subtitle="Assigned"
        />
        <AnalyticsCard
          title="Available Slots"
          value={stats.availableSlots}
          icon={Inbox}
          colorClass="text-green-600 bg-green-100"
          subtitle="Open capacity"
        />
        <AnalyticsCard
          title="Upcoming Starts"
          value={stats.upcomingStarts}
          icon={Clock}
          colorClass="text-amber-600 bg-amber-100"
          subtitle="Within 7 days"
        />
      </div>

      <Suspense fallback={<div className="h-10 bg-gray-100 rounded animate-pulse mb-4" />}>
        <ScheduleFilters />
      </Suspense>

      <SchedulePageClient schedules={schedules.data} courses={courses} />

      {schedules.totalPages > 1 && (
        <Pagination
          page={schedules.page}
          totalPages={schedules.totalPages}
          total={schedules.total}
          limit={schedules.limit}
        />
      )}
    </>
  );
}
