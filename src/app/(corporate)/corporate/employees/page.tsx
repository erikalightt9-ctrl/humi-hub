import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrganizationEmployees } from "@/lib/repositories/organization.repository";
import { EmployeeManager } from "@/components/corporate/EmployeeManager";
import { Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Employees | HUMI Corporate",
};

export default async function CorporateEmployeesPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;

  if (!user || user.role !== "corporate" || !user.organizationId) {
    redirect("/corporate/login");
  }

  const employees = await getOrganizationEmployees(user.organizationId);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-100 rounded-lg p-2">
            <Users className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
            <p className="text-sm text-gray-500">
              Manage your organization&apos;s employee enrollments
            </p>
          </div>
        </div>
      </div>

      <EmployeeManager employees={employees} />
    </div>
  );
}
