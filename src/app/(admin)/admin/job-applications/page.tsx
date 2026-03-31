import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JobApplicationManager } from "@/components/admin/JobApplicationManager";
import { ClipboardCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Job Applications | Humi Hub Admin",
};

export default async function JobApplicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/portal?tab=admin");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-50 rounded-lg p-2">
            <ClipboardCheck className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Job Applications
            </h1>
            <p className="text-sm text-gray-500">
              Review and manage student job applications
            </p>
          </div>
        </div>
      </div>

      {/* Manager */}
      <JobApplicationManager />
    </div>
  );
}
