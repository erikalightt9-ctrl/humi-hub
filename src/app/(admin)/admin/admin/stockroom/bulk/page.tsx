"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BulkStockGrid } from "@/components/admin/bulk-stock/BulkStockGrid";

export default function BulkStockPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin/admin/stockroom"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Inventory
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Bulk Stock Entry</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Spreadsheet-style grid for fast encoding. Paste from Excel/Sheets to import many rows at once.
          </p>
        </div>
      </div>

      <BulkStockGrid />
    </div>
  );
}
