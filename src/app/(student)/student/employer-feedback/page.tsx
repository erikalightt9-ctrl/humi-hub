import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudentFeedback } from "@/lib/repositories/employer-feedback.repository";
import { EmployerFeedbackList } from "@/components/student/EmployerFeedbackList";
import { MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Employer Feedback | HUMI Student",
};

export default async function EmployerFeedbackPage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  const feedback = await getStudentFeedback(studentId);

  const serialized = feedback.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-100 rounded-lg p-2">
            <MessageSquare className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Employer Feedback
            </h1>
            <p className="text-sm text-gray-500">
              Reviews from employers and clients on your work
            </p>
          </div>
        </div>
      </div>

      <EmployerFeedbackList feedback={serialized} />
    </div>
  );
}
