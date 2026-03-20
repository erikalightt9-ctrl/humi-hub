import type { Metadata } from "next";
import { ReportsPageClient } from "@/components/admin/ReportsPageClient";

export const metadata: Metadata = { title: "Reports | HUMI Admin" };

export default function ReportsPage() {
  return <ReportsPageClient />;
}
