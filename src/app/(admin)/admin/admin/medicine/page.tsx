"use client";

import { Pill } from "lucide-react";
import { BulkStockGrid } from "@/components/admin/bulk-stock/BulkStockGrid";

export default function MedicinePage() {
  return (
    <div className="p-6 max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-pink-600 flex items-center justify-center shrink-0">
          <Pill className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Medicine & First Aid</h1>
          <p className="text-sm text-slate-500">Track medicines, first aid supplies, and health essentials</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Bulk Stock Entry</h2>
          <p className="text-sm text-slate-500">Spreadsheet-style grid for fast encoding. Paste from Excel/Sheets to import many rows at once.</p>
        </div>
        <BulkStockGrid />
      </div>
    </div>
  );
}
