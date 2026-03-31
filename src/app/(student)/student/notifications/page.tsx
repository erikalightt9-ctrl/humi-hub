import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { NotificationCenter } from "@/components/shared/NotificationCenter";

export const metadata: Metadata = { title: "Notifications | Humi Hub Student" };

export default function StudentNotificationsPage() {
  return <NotificationCenter />;
}
