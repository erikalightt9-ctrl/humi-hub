import { ModulePlaceholder } from "@/components/admin/ModulePlaceholder";

export default function ITPage() {
  return (
    <ModulePlaceholder
      module="IT"
      iconName="Monitor"
      description="Track IT assets, manage help desk tickets, software licenses, and system access."
      features={[
        "Asset inventory & tracking",
        "Help desk & ticketing",
        "Software license management",
        "User access provisioning",
        "Incident management",
        "IT audit logs",
      ]}
    />
  );
}
