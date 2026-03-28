import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrganizationEmployees } from "@/lib/repositories/organization.repository";
import { EmployeeManager } from "@/components/corporate/EmployeeManager";

export const metadata: Metadata = {
  title: "Students | HUMI Corporate",
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
        <h1 className="text-xl font-bold text-gray-900">Students</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your team members and their course enrollments
        </p>
      </div>

      <EmployeeManager employees={employees} />
    </div>
  );
}
