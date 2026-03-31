import type { Metadata } from "next";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import { CalendarClock, Users, Inbox, Clock, ListOrdered, BarChart2 } from "lucide-react";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import { ScheduleFilters } from "@/components/admin/ScheduleFilters";
import { SchedulePageClient } from "@/components/admin/SchedulePageClient";
import { Pagination } from "@/components/admin/Pagination";
import { listSchedules, getScheduleStats } from "@/lib/repositories/schedule.repository";
import { prisma } from "@/lib/prisma";
import type { ScheduleFilters as ScheduleFilterType } from "@/types";
import type { ScheduleStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Schedules | Humi Hub Admin" };

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <AnalyticsCard
          title="Active Batches"
          value={stats.totalActive}
          icon={CalendarClock}
          colorClass="text-blue-700 bg-blue-50"
          subtitle="Open + Full"
        />
        <AnalyticsCard
          title="Students Enrolled"
          value={stats.totalStudents}
          icon={Users}
          colorClass="text-indigo-700 bg-indigo-50"
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
          colorClass="text-amber-600 bg-amber-50"
          subtitle="Within 7 days"
        />
        <AnalyticsCard
          title="On Waitlist"
          value={stats.totalWaiting}
          icon={ListOrdered}
          colorClass="text-rose-600 bg-rose-100"
          subtitle="Pending promotion"
        />
        <AnalyticsCard
          title="Seat Utilization"
          value={`${stats.seatUtilizationPct}%`}
          icon={BarChart2}
          colorClass="text-blue-700 bg-blue-50"
          subtitle="Active batches"
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
