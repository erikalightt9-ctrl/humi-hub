import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrganizationEmployees } from "@/lib/repositories/organization.repository";
import { EmployeeManager } from "@/components/corporate/EmployeeManager";
import Link from "next/link";
import { Users, BookOpen, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Students | HUMI Hub Corporate",
};

export default async function CorporateEmployeesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;

  if (!user || user.role !== "corporate" || !user.organizationId) {
    redirect("/corporate/login");
  }

  const employees = await getOrganizationEmployees(user.organizationId);

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ds-text">Students</h1>
        <p className="text-sm text-ds-muted mt-0.5">
          Manage your team members and their course enrollments
        </p>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <Link
          href="/corporate/courses/list"
          className="group bg-ds-card rounded-xl border border-ds-border p-4 flex flex-col gap-2 hover:border-ds-primary/50 hover:shadow-lg hover:shadow-black/20 transition-all"
        >
          <div className="p-2 rounded-xl w-fit bg-emerald-50 text-emerald-700">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ds-text group-hover:text-blue-700 transition-colors">Browse Courses</p>
            <p className="text-xs text-ds-muted mt-0.5 leading-relaxed">View available programs</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-blue-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
            Open <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <div className="bg-ds-card rounded-xl border border-ds-border p-4 flex flex-col gap-2">
          <div className="p-2 rounded-xl w-fit bg-blue-50 text-blue-700">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-ds-text">Enroll Student</p>
            <p className="text-xs text-ds-muted mt-0.5 leading-relaxed">Use the form below</p>
          </div>
        </div>
      </div>

      <EmployeeManager employees={employees} />
    </div>
  );
}
