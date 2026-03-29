import { redirect } from "next/navigation";

interface ViewTenantRootProps {
  readonly params: Promise<{ tenantId: string }>;
}

export default async function ViewTenantRoot({ params }: ViewTenantRootProps) {
  const { tenantId } = await params;
  redirect(`/superadmin/view/${tenantId}/dashboard`);
}
