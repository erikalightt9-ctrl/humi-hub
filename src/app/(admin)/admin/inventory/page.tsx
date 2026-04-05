import { ModulePlaceholder } from "@/components/admin/ModulePlaceholder";

export default function InventoryPage() {
  return (
    <ModulePlaceholder
      module="Inventory"
      iconName="Package"
      description="Manage stock levels, warehouses, purchase orders, and supplier relationships."
      features={[
        "Product catalog & SKUs",
        "Stock level tracking",
        "Purchase orders",
        "Warehouse management",
        "Low stock alerts",
        "Supplier management",
      ]}
    />
  );
}
