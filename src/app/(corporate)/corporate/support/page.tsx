import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { SupportTicketView } from "@/components/shared/SupportTicketView";

export const metadata: Metadata = { title: "Support | Humi Hub Corporate" };

export default function CorporateSupportPage() {
  return <SupportTicketView />;
}
