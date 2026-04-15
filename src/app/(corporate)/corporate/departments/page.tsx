import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listEmployees } from "@/lib/repositories/hr-employee.repository";
import { DepartmentsPage } from "@/components/corporate/DepartmentsPage";

export const metadata: Metadata = {
  title: "Departments | HUMI Hub Corporate",
};

const DEPT_NAMES = [
  "Administration & HR",
  "Finance & Payroll",
  "Operations",
  "Sales & Marketing",
  "IT & Systems",
  "Logistics & Procurement",
] as const;

export default async function CorporateDepartmentsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;

  if (!user || user.role !== "corporate" || !user.organizationId) {
    redirect("/corporate/login");
  }

  const orgId = (user as { organizationId: string }).organizationId;
  const counts = await Promise.all(
    DEPT_NAMES.map(async (dept) => {
      const result = await listEmployees(orgId, { department: dept, limit: 1 });
      return { department: dept, count: result.total };
    }),
  );

  return <DepartmentsPage deptCounts={counts} />;
}
