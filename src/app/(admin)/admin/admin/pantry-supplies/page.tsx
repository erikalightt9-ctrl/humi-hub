"use client";

import { UtensilsCrossed } from "lucide-react";
import { BulkStockGrid } from "@/components/admin/bulk-stock/BulkStockGrid";

export default function PantrySuppliesPage() {
  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
          <UtensilsCrossed className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pantry Supplies</h1>
          <p className="text-sm text-slate-500">Track pantry items, food supplies, and kitchen essentials</p>
        </div>
      </div>

      <BulkStockGrid />
    </div>
  );
}
