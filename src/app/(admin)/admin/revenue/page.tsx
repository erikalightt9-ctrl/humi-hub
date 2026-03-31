import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { TenantRevenueClient } from "@/components/admin/TenantRevenueClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Revenue | Humi Hub Admin" };

export default async function TenantRevenuePage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/portal?tab=admin");
  }

  return <TenantRevenueClient />;
}
