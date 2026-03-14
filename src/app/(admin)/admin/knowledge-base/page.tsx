import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { KnowledgeBaseManager } from "@/components/admin/KnowledgeBaseManager";

export const metadata: Metadata = { title: "Knowledge Base | HUMI Admin" };

export default function AdminKnowledgeBasePage() {
  return <KnowledgeBaseManager />;
}
