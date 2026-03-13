import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JobPostingManager } from "@/components/admin/JobPostingManager";
import { Briefcase } from "lucide-react";

export const metadata: Metadata = {
  title: "Job Postings | HUMI Admin",
};

export default async function AdminJobPostingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/portal?tab=admin");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-100 rounded-lg p-2">
            <Briefcase className="h-5 w-5 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
            <p className="text-sm text-gray-500">
              Manage job postings for AI-powered student matching
            </p>
          </div>
        </div>
      </div>

      {/* Manager */}
      <JobPostingManager />
    </div>
  );
}
