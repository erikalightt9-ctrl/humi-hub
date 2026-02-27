import type { Metadata } from "next";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { FilterBar } from "@/components/admin/FilterBar";
import { EnrolleesTable } from "@/components/admin/EnrolleesTable";
import { Pagination } from "@/components/admin/Pagination";
import { listEnrollments } from "@/lib/repositories/enrollment.repository";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { EnrollmentFilters } from "@/types";
import type { CourseSlug, EnrollmentStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Enrollees | VA Admin" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    courseSlug?: string;
  }>;
}

export default async function EnrolleesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const filters: EnrollmentFilters = {
    page: parseInt(params.page ?? "1", 10),
    limit: 20,
    search: params.search,
  };

  if (params.status) filters.status = params.status as EnrollmentStatus;
  if (params.courseSlug) filters.courseSlug = params.courseSlug as CourseSlug;

  const result = await listEnrollments(filters);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollees</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all enrollment applications</p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <a href="/api/admin/export">
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </Button>
      </div>

      <Suspense fallback={<div className="h-12 bg-gray-100 rounded animate-pulse mb-6" />}>
        <FilterBar />
      </Suspense>

      <EnrolleesTable enrollments={result.data} />

      {result.totalPages > 1 && (
        <Suspense fallback={null}>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            limit={result.limit}
          />
        </Suspense>
      )}
    </AdminLayout>
  );
}
