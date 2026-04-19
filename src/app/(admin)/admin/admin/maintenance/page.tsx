"use client";

import { Wrench } from "lucide-react";
import { BulkStockGrid } from "@/components/admin/bulk-stock/BulkStockGrid";

export default function MaintenanceInventoryPage() {
  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-amber-600 flex items-center justify-center shrink-0">
          <Wrench className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Maintenance Supplies</h1>
          <p className="text-sm text-slate-500">Tools, cleaning supplies, and maintenance materials</p>
        </div>
      </div>

      <BulkStockGrid />
    </div>
  );
}
