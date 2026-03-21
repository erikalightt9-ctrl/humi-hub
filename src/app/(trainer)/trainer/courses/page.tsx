import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getTrainerCourses } from "@/lib/repositories/trainer.repository";
import { TrainerCourseSearch } from "@/components/trainer/TrainerCourseSearch";

export const metadata: Metadata = {
  title: "My Courses | HUMI Trainer Portal",
};
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TrainerCoursesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | (typeof session & { user: { id: string; role: string } })["user"]
    | undefined;

  if (!user || user.role !== "trainer") {
    redirect("/trainer/login");
  }

  const courses = await getTrainerCourses(user.id);

  // Calculate total students across all schedules for each course
  const coursesWithStudents = courses.map((course) => {
    const studentCount = course.schedules.reduce(
      (sum, s) => sum + s._count.students,
      0,
    );
    return { ...course, studentCount };
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-500 text-sm mt-1">
          Course content synced from your assigned training schedules.
        </p>
      </div>

      <TrainerCourseSearch courses={coursesWithStudents} />
    </>
  );
}
