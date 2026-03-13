import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  ClipboardCheck,
  HelpCircle,
  Users,
  ChevronRight,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getTrainerCourses } from "@/lib/repositories/trainer.repository";

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

      {coursesWithStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coursesWithStudents.map((course) => (
            <Link
              key={course.id}
              href={`/trainer/courses/${course.id}`}
              className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-100 rounded-lg p-2.5">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors mt-1" />
              </div>

              <h3 className="font-semibold text-gray-900 text-sm mb-3 line-clamp-2">
                {course.title}
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span>{course._count.lessons} Lessons</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>{course._count.assignments} Assignments</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{course._count.quizzes} Quizzes</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>{course.studentCount} Students</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Courses Found
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            You are not assigned to any training schedules yet. Once an admin
            assigns you to a schedule, the course content will appear here.
          </p>
        </div>
      )}
    </>
  );
}
