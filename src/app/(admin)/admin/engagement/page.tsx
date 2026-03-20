

import { getCourseEngagementMetrics } from "@/lib/repositories/engagement.repository";
import { CourseEngagementCard } from "@/components/admin/CourseEngagementCard";
import { StudentEngagementTable } from "@/components/admin/StudentEngagementTable";

export const dynamic = "force-dynamic";

export const metadata = {

  title: "Engagement | Admin Dashboard",


};

export default async function EngagementPage() {


  const courseMetrics = await getCourseEngagementMetrics();

  const courseOptions = courseMetrics.map((m) => ({

    id: m.courseId,

    title: m.courseTitle,


  }));

  return (

    <div className="space-y-8">

      <div>

        <h1 className="text-2xl font-bold tracking-tight text-gray-900">

          Attendance & Engagement

        </h1>

        <p className="mt-1 text-sm text-gray-500">

          Monitor course performance and student activity across all active

          courses.

        </p>


      </div>

      {/* Section 1: Course-Level Overview */}

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

      {/* Section 2: Student Activity Table */}

      <section>

        <h2 className="mb-4 text-lg font-semibold text-gray-800">

          Student Activity

        </h2>

        <StudentEngagementTable courses={courseOptions} />

      </section>

    </div>

  );
}
}
