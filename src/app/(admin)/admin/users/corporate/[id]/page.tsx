import type { Metadata } from "next";
import { CorporateDetailClient } from "@/components/admin/CorporateDetailClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Company Detail | Humi Hub Admin" };

export default async function CorporateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CorporateDetailClient id={id} />;
}
