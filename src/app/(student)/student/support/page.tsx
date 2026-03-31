import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { SupportTicketView } from "@/components/shared/SupportTicketView";

export const metadata: Metadata = { title: "Support | Humi Hub Student" };

export default function StudentSupportPage() {
  return <SupportTicketView />;
}
