import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getTrainerStudents } from "@/lib/repositories/trainer.repository";
import { StudentProgressTable } from "@/components/trainer/StudentProgressTable";

export const metadata: Metadata = {
  title: "My Students | HUMI Trainer Portal",
};
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TrainerStudentsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | (typeof session & { user: { id: string; role: string } })["user"]
    | undefined;

  if (!user || user.role !== "trainer") {
    redirect("/trainer/login");
  }

  const students = await getTrainerStudents(user.id);

  // Serialize for client component
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
        <p className="text-gray-500 text-sm mt-1">
          Students assigned to your training batches. Click a row to view
          detailed progress.
        </p>
      </div>

      {serialized.length > 0 ? (
        <StudentProgressTable students={serialized} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Students Yet
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            You do not have any students assigned to you yet. Students will
            appear here once they are enrolled in your training batches.
          </p>
        </div>
      )}
    </>
  );
}
