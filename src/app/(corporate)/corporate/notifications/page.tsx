import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { NotificationCenter } from "@/components/shared/NotificationCenter";

export const metadata: Metadata = { title: "Notifications | Humi Hub Corporate" };

export default function CorporateNotificationsPage() {
  return <NotificationCenter />;
}
