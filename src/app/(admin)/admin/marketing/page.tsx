import { ModulePlaceholder } from "@/components/admin/ModulePlaceholder";

export default function MarketingPage() {
  return (
    <ModulePlaceholder
      module="Marketing"
      iconName="Megaphone"
      description="Run campaigns, capture leads, automate emails, and measure marketing performance."
      features={[
        "Campaign management",
        "Lead capture & CRM",
        "Email automation",
        "Landing pages",
        "Analytics & attribution",
        "Social media integration",
      ]}
    />
  );
}
