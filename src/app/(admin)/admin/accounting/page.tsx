import { ModulePlaceholder } from "@/components/admin/ModulePlaceholder";

export default function AccountingPage() {
  return (
    <ModulePlaceholder
      module="Accounting"
      iconName="Landmark"
      description="Track income, expenses, invoices, and generate financial reports."
      features={[
        "Invoice creation & management",
        "Expense tracking",
        "Chart of accounts",
        "Financial statements",
        "Tax management",
        "Bank reconciliation",
      ]}
    />
  );
}
