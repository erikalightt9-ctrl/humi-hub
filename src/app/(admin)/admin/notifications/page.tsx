import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { NotificationCenter } from "@/components/shared/NotificationCenter";

export const metadata: Metadata = { title: "Notifications | HUMI Hub Admin" };

export default function AdminNotificationsPage() {
  return <NotificationCenter />;
}
