import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";

export const metadata = { title: "Super Admin | Platform Control" };

export default function SuperAdminPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperAdminLayout>{children}</SuperAdminLayout>;
}
