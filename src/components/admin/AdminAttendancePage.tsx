"use client";

/**
 * AdminAttendancePage
 *
 * Course selector + per-course attendance analytics view for admins.
 * The admin picks a course and sees analytics (not the live table).
 */
import { useState } from "react";
import { BarChart2 } from "lucide-react";
import { AdminAttendanceAnalytics } from "@/components/admin/AdminAttendanceAnalytics";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CourseOption {
  readonly id: string;
  readonly title: string;
}

interface AdminAttendancePageProps {
  readonly courses: ReadonlyArray<CourseOption>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminAttendancePageClient({
  courses,
}: AdminAttendancePageProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id ?? "",
  );

  return (
    <div className="space-y-6">
      {/* Course selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <label
          htmlFor="course-select"
          className="text-sm font-medium text-gray-700 shrink-0"
        >
          Course
        </label>
        {courses.length === 0 ? (
          <p className="text-sm text-gray-400">No courses found.</p>
        ) : (
          <select
            id="course-select"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="flex-1 max-w-sm text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Analytics */}
      {selectedCourseId ? (
        <AdminAttendanceAnalytics
          key={selectedCourseId}
          courseId={selectedCourseId}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <BarChart2 className="h-10 w-10 opacity-40" />
          <p className="text-sm">Select a course to view analytics.</p>
        </div>
      )}
    </div>
  );
}
