import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getTrainerStudents } from "@/lib/repositories/trainer.repository";
import { StudentProgressTable } from "@/components/trainer/StudentProgressTable";

export const metadata: Metadata = { title: "My Students | Humi Hub Trainer Portal" };
export const dynamic = "force-dynamic";

export default async function TrainerStudentListPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id: string; role: string } | undefined;

  if (!user || user.role !== "trainer") {
    redirect("/trainer/login");
  }

  const students = await getTrainerStudents(user.id);

  const serialized = students.map((student) => ({
    id: student.id,
    name: student.name,
    email: student.enrollment?.email ?? student.email,
    fullName: student.enrollment?.fullName ?? student.name,
    courseTitle: student.enrollment?.course?.title ?? "N/A",
    completionCount: student._count.completions,
    submissionCount: student._count.submissions,
  }));

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-8">
        <Link href="/trainer/students" className="hover:text-blue-700 transition-colors">
          Students
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900 font-medium">My Students</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
        <p className="text-gray-500 text-sm mt-1">
          Students assigned to your training batches. Click a row to view detailed progress.
        </p>
      </div>

      {serialized.length > 0 ? (
        <StudentProgressTable students={serialized} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-blue-700" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Students Yet</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            You do not have any students assigned to you yet. Students will appear here
            once they are enrolled in your training batches.
          </p>
        </div>
      )}
    </>
  );
}
