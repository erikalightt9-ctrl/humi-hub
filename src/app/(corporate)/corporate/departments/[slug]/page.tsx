import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { listEmployees } from "@/lib/repositories/hr-employee.repository";
import { DepartmentDetail } from "@/components/corporate/DepartmentDetail";
import { DEPARTMENTS } from "@/components/corporate/DepartmentsPage";

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dept = DEPARTMENTS.find((d) => d.slug === slug);
  return {
    title: dept ? `${dept.name} | HUMI Hub Corporate` : "Department | HUMI Hub Corporate",
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const found = DEPARTMENTS.find((d) => d.slug === slug);
  if (!found) notFound();
  const deptConfig = found as NonNullable<typeof found>;

  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;

  if (!user || user.role !== "corporate" || !user.organizationId) {
    redirect("/corporate/login");
  }

  const orgId = (user as { organizationId: string }).organizationId;
  const result = await listEmployees(orgId, {
    department: deptConfig.name,
    limit: 100,
  });

  return (
    <DepartmentDetail
      dept={deptConfig}
      employees={result.data.map((e: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string | null;
        position: string;
        department?: string | null;
        status: string;
        employmentType?: string | null;
        employeeNumber?: string | null;
      }) => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        phone: e.phone ?? null,
        position: e.position,
        department: e.department ?? null,
        status: e.status,
        employmentType: e.employmentType ?? null,
        employeeNumber: e.employeeNumber ?? null,
      }))}
      total={result.total}
    />
  );
}
