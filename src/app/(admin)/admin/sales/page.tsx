import { ModulePlaceholder } from "@/components/admin/ModulePlaceholder";

export default function SalesPage() {
  return (
    <ModulePlaceholder
      module="Sales"
      iconName="TrendingUp"
      description="Track deals, manage your sales pipeline, create quotes, and grow customer relationships."
      features={[
        "Sales pipeline & deals",
        "Customer management (CRM)",
        "Quotes & proposals",
        "Sales forecasting",
        "Activity tracking",
        "Commission management",
      ]}
    />
  );
}
