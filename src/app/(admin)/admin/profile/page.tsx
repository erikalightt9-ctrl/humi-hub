import type { Metadata } from "next";
import { AdminProfileClient } from "@/components/admin/AdminProfileClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Profile | HUMI Hub Admin" };

export default function AdminProfilePage() {
  return <AdminProfileClient />;
}
