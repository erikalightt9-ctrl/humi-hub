import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getPendingSubmissionsForTrainer } from "@/lib/repositories/trainer.repository";
import { GradingQueueClient } from "@/components/trainer/GradingQueueClient";

export const metadata: Metadata = {
  title: "Grading Queue | HUMI Trainer Portal",
};
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TrainerSubmissionsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | (typeof session & { user: { id: string; role: string } })["user"]
    | undefined;

  if (!user || user.role !== "trainer") {
    redirect("/trainer/login");
  }

  const submissions = await getPendingSubmissionsForTrainer(user.id);

  // Serialize dates for client component
  const serialized = submissions.map((s) => ({
    id: s.id,
    fileName: s.fileName,
    filePath: s.filePath,
    fileSize: s.fileSize,
    submittedAt: s.submittedAt.toISOString(),
    student: s.student,
    assignment: {
      id: s.assignment.id,
      title: s.assignment.title,
      maxPoints: s.assignment.maxPoints,
      courseTitle: s.assignment.course.title,
    },
  }));

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Grading Queue</h1>
        <p className="text-gray-500 text-sm mt-1">
          Review and grade pending student submissions.
        </p>
      </div>

      {serialized.length > 0 ? (
        <GradingQueueClient submissions={serialized} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            All Caught Up!
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            There are no pending submissions to grade. Check back later as
            students submit their assignments.
          </p>
        </div>
      )}
    </>
  );
}
