import type { Metadata } from "next";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import { EnrolleesTabs } from "@/components/admin/EnrolleesTabs";
import { listEnrollments } from "@/lib/repositories/enrollment.repository";
import { listEnrollees, getEnrolleeStats } from "@/lib/repositories/enrollee.repository";
import { Button } from "@/components/ui/button";
import {
  Download,
  Users,
  CreditCard,
  AlertCircle,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import type { EnrollmentFilters, EnrolleeFilters } from "@/types";
import type { EnrollmentStatus, StudentPaymentStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Enrollees | HUMI Admin" };

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    paymentStatus?: string;
    courseSlug?: string;
    accessGranted?: string;
    batch?: string;
  }>;
}

export default async function EnrolleesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeTab = params.tab ?? "applications";

  // Build filters for Applications tab (Enrollment model)
  const appFilters: EnrollmentFilters = {
    page: activeTab === "applications" ? parseInt(params.page ?? "1", 10) : 1,
    limit: 20,
    search: activeTab === "applications" ? params.search : undefined,
  };
  if (activeTab === "applications" && params.status) {
    appFilters.status = params.status as EnrollmentStatus;
  }
  if (activeTab === "applications" && params.courseSlug) {
    appFilters.courseSlug = params.courseSlug;
  }

  // Build filters for Active Enrollees tab (Student model)
  const enrolleeFilters: EnrolleeFilters = {
    page: activeTab === "enrollees" ? parseInt(params.page ?? "1", 10) : 1,
    limit: 20,
    search: activeTab === "enrollees" ? params.search : undefined,
  };
  if (activeTab === "enrollees" && params.paymentStatus) {
    enrolleeFilters.paymentStatus = params.paymentStatus as StudentPaymentStatus;
  }
  if (activeTab === "enrollees" && params.courseSlug) {
    enrolleeFilters.courseSlug = params.courseSlug;
  }
  if (activeTab === "enrollees" && params.accessGranted === "true") {
    enrolleeFilters.accessGranted = true;
  }
  if (activeTab === "enrollees" && params.accessGranted === "false") {
    enrolleeFilters.accessGranted = false;
  }
  if (activeTab === "enrollees" && params.batch) {
    enrolleeFilters.batch = params.batch;
  }

  const [applications, enrollees, stats] = await Promise.all([
    listEnrollments(appFilters),
    listEnrollees(enrolleeFilters),
    getEnrolleeStats(),
  ]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ds-text">Enrollees</h1>
          <p className="text-ds-muted text-sm mt-1">
            Manage applications, enrollees, payments, and access
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <a href="/api/admin/export">
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <AnalyticsCard
          title="Applications"
          value={applications.total}
          icon={ClipboardList}
          colorClass="text-blue-400 bg-blue-900/40"
          subtitle="All submissions"
        />
        <AnalyticsCard
          title="Active Enrollees"
          value={stats.total}
          icon={Users}
          colorClass="text-indigo-400 bg-indigo-900/40"
          subtitle="Approved"
        />
        <AnalyticsCard
          title="Paid"
          value={stats.paid}
          icon={CreditCard}
          colorClass="text-emerald-400 bg-emerald-900/40"
          subtitle="Fully paid"
        />
        <AnalyticsCard
          title="Unpaid / Partial"
          value={stats.unpaid + stats.partial}
          icon={AlertCircle}
          colorClass="text-amber-400 bg-amber-900/40"
          subtitle={`${stats.partial} partial, ${stats.unpaid} unpaid`}
        />
        <AnalyticsCard
          title="Access Granted"
          value={stats.accessGranted}
          icon={ShieldCheck}
          colorClass="text-purple-400 bg-purple-900/40"
          subtitle="Active access"
        />
      </div>

      <Suspense fallback={<div className="h-12 bg-ds-surface rounded animate-pulse mb-6" />}>
        <EnrolleesTabs
          applications={applications}
          enrollees={enrollees}
        />
      </Suspense>
    </>
  );
}
