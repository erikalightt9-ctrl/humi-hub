import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JobMatchDashboard } from "@/components/student/JobMatchDashboard";
import { Briefcase } from "lucide-react";

export const metadata: Metadata = {
  title: "Job Matches | Humi Hub Student",
};

export default async function StudentJobMatchesPage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-50 rounded-lg p-2">
            <Briefcase className="h-5 w-5 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              AI Job Matches
            </h1>
            <p className="text-sm text-gray-500">
              Find jobs matched to your skills and training
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <JobMatchDashboard />
    </div>
  );
}
