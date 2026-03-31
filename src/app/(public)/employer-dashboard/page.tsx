import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getEmployerSession } from "@/lib/employer-auth";
import { prisma } from "@/lib/prisma";
import { HiringPipeline } from "@/components/employer/HiringPipeline";
import { Briefcase, Plus, Users, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Employer Dashboard — HUMI Hub" };
export const dynamic = "force-dynamic";

export default async function EmployerDashboardPage() {
  const employer = await getEmployerSession();
  if (!employer) redirect("/employer-dashboard/login");

  const [jobs, applications] = await Promise.all([
    prisma.employerJobPosting.findMany({
      where: { employerId: employer.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { applications: true } } },
    }),
    prisma.employerApplication.findMany({
      where: { jobPosting: { employerId: employer.id } },
      orderBy: { createdAt: "desc" },
      include: { jobPosting: { select: { title: true } } },
    }),
  ]);

  const stats = {
    activeJobs: jobs.filter((j) => j.isActive).length,
    totalApplicants: applications.length,
    interviews: applications.filter((a) => a.stage === "INTERVIEW").length,
    hired: applications.filter((a) => a.stage === "HIRED").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-blue-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold">{employer.companyName}</h1>
            <p className="text-blue-200 text-sm">Employer Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/employer-dashboard/jobs/new">
              <Button className="bg-white text-blue-900 font-bold hover:bg-blue-50 gap-2">
                <Plus className="h-4 w-4" /> Post a Job
              </Button>
            </Link>
            <form action="/api/employer/auth/logout" method="POST">
              <button type="submit" className="text-sm text-blue-200 hover:text-white underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Briefcase, label: "Active Jobs", value: stats.activeJobs, color: "text-blue-600" },
            { icon: Users, label: "Total Applicants", value: stats.totalApplicants, color: "text-purple-600" },
            { icon: Clock, label: "In Interview", value: stats.interviews, color: "text-amber-600" },
            { icon: CheckCircle2, label: "Hired", value: stats.hired, color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <s.icon className={`h-6 w-6 ${s.color} mb-2`} />
              <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Listings sidebar */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-gray-900">Your Job Posts</h2>
              <Link href="/employer-dashboard/jobs/new" className="text-sm text-blue-600 font-semibold hover:text-blue-700">
                + New
              </Link>
            </div>
            <div className="space-y-3">
              {jobs.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  No jobs yet.{" "}
                  <Link href="/employer-dashboard/jobs/new" className="text-blue-600 font-semibold">
                    Post your first job
                  </Link>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{job.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{job.location} · {job.type}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        job.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {job.isActive ? "Active" : "Closed"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Hiring Pipeline */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4">Hiring Pipeline</h2>
            <HiringPipeline initialApplications={applications as never} />
          </div>
        </div>
      </main>
    </div>
  );
}
