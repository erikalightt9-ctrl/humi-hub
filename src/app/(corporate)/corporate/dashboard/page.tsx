import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrganizationDashboardStats } from "@/lib/repositories/organization.repository";
import { CorporateDashboard } from "@/components/corporate/CorporateDashboard";

export const metadata: Metadata = {
  title: "Dashboard | HUMI Hub Corporate",
};

export default async function CorporateDashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;

  if (!user || user.role !== "corporate" || !user.organizationId) {
    redirect("/corporate/login");
  }

  const stats = await getOrganizationDashboardStats(user.organizationId);

  return <CorporateDashboard stats={stats} />;
}
