import { UnifiedAdminLayout } from "@/components/superadmin/UnifiedAdminLayout";

export const metadata = { title: "Super Admin | Platform Control" };

export default function SuperAdminPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UnifiedAdminLayout>{children}</UnifiedAdminLayout>;
}
