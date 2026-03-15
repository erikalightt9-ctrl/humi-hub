import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { getCourseEngagementMetrics } from "@/lib/repositories/engagement.repository";
import { getTrainerUtilizationStats } from "@/lib/repositories/trainer-availability.repository";
import { CourseEngagementCard } from "@/components/admin/CourseEngagementCard";
import { StudentEngagementTable } from "@/components/admin/StudentEngagementTable";
import { AttendanceLiveTable } from "@/components/admin/AttendanceLiveTable";
import { TrainerUtilizationTable } from "@/components/admin/TrainerUtilizationTable";

export const metadata: Metadata = { title: "Analytics | HUMI Admin" };

export default async function AnalyticsPage() {
  const [courseMetrics, trainerStats] = await Promise.all([
    getCourseEngagementMetrics(),
    getTrainerUtilizationStats(),
  ]);

  const courseOptions = courseMetrics.map((m) => ({
    id: m.courseId,
    title: m.courseTitle,
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          Attendance tracking, course engagement, student activity, and scheduling
        </p>
      </div>

      {/* Section 1: Live Attendance */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Attendance
        </h2>
        <AttendanceLiveTable />
      </section>

      {/* Section 2: Course Engagement Overview */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Course Overview
        </h2>
        {courseMetrics.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-gray-500">No active courses found.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courseMetrics.map((m) => (
              <CourseEngagementCard key={m.courseId} metrics={m} />
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Student Activity Table */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Student Activity
        </h2>
        <StudentEngagementTable courses={courseOptions} />
      </section>

      {/* Section 4: Scheduling Analytics */}
      <section>
        <h2 className="mb-1 text-lg font-semibold text-gray-800">
          Scheduling Analytics
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Trainer utilization across active and full schedules
        </p>
        <TrainerUtilizationTable stats={trainerStats} />
      </section>
    </div>
  );
}
