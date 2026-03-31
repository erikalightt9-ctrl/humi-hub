import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEmployerSession } from "@/lib/employer-auth";
import { JobPostingForm } from "@/components/employer/JobPostingForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Post a Job — Humi Hub" };
export const dynamic = "force-dynamic";

export default async function PostJobPage() {
  const employer = await getEmployerSession();
  if (!employer) redirect("/employer-dashboard/login");

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/employer-dashboard"
          className="inline-flex items-center gap-1 text-sm text-blue-600 font-semibold hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Post a New Job</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Your listing will be visible to all Humi Hub graduates seeking placement.
        </p>
        <JobPostingForm />
      </div>
    </div>
  );
}
