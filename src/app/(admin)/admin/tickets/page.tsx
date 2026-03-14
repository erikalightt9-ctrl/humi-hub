import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { TicketManager } from "@/components/admin/TicketManager";

export const metadata: Metadata = { title: "Support Tickets | HUMI Admin" };

export default function AdminTicketsPage() {
  return <TicketManager />;
}
