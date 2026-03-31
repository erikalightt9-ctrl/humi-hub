import type { Metadata } from "next";
import { HumiAdminLayout } from "@/components/humi-admin/HumiAdminLayout";

export const metadata: Metadata = {
  title: "HUMI Admin | Platform Support",
  description: "HUMI Hub platform support staff portal",
};

export default function HumiAdminPagesLayout({ children }: { children: React.ReactNode }) {
  return <HumiAdminLayout>{children}</HumiAdminLayout>;
}
