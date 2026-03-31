import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ReportsPageClient } from "@/components/admin/ReportsPageClient";

export const metadata: Metadata = { title: "Reports Export | Humi Hub Admin" };

export default function ReportsSummaryPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/admin/reports" className="hover:text-blue-700 transition-colors">
          Reports
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900 font-medium">Reports Export</span>
      </nav>

      <ReportsPageClient />
    </div>
  );
}
