import type { Metadata } from "next";
import { SessionProvider } from "@/components/admin/SessionProvider";
import { HumiAdminLayout } from "@/components/humi-admin/HumiAdminLayout";

export const metadata: Metadata = {
  title: "HUMI Admin | Platform Support",
  description: "HUMI Hub platform support staff portal",
};

export default function HumiAdminPagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <HumiAdminLayout>{children}</HumiAdminLayout>
    </SessionProvider>
  );
}
