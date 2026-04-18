"use client";

import { useCallback, useMemo, useRef, useState, ClipboardEvent } from "react";
import { Plus, Trash2, Save, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { EditableCell } from "./EditableCell";
import { useKeyboardNavigation, CellPos } from "./useKeyboardNavigation";
import { parseClipboardData } from "./parseClipboardData";

const CATEGORIES = [
  "Cleaning Supplies",
  "Pantry Supplies",
  "Maintenance Supplies",
  "Assets",
  "Stockroom Stocks",
] as const;

const UNITS_SUGGEST = ["pcs", "box", "liters", "kg", "pack", "bottle"];

type Row = {
  name: string;
  category: string;
  quantity: string;
  unit: string;
  minThreshold: string;
};

const COLUMNS = ["name", "category", "quantity", "unit", "minThreshold"] as const;
type ColKey = (typeof COLUMNS)[number];

const COL_COUNT = COLUMNS.length;
const DEFAULT_ROWS = 5;

function makeEmptyRow(): Row {
  return { name: "", category: "", quantity: "", unit: "pcs", minThreshold: "0" };
}

function isRowEmpty(r: Row): boolean {
  return !r.name.trim() && !r.category && !r.quantity.trim() && !r.minThreshold.trim();
}

function isRowFilled(r: Row): boolean {
  return !!r.name.trim() && !!r.category && r.quantity.trim() !== "" && !!r.unit.trim();
}

type CellError = { name?: boolean; category?: boolean; quantity?: boolean; unit?: boolean; minThreshold?: boolean };

function validateRow(r: Row): CellError {
  const errs: CellError = {};
  const isEmpty = isRowEmpty(r);
  if (isEmpty) return errs;
  if (!r.name.trim()) errs.name = true;
  if (!r.category || !(CATEGORIES as readonly string[]).includes(r.category)) errs.category = true;
  const q = Number(r.quantity);
  if (r.quantity.trim() === "" || isNaN(q) || q < 0) errs.quantity = true;
  if (!r.unit.trim()) errs.unit = true;
  const m = Number(r.minThreshold);
  if (r.minThreshold.trim() !== "" && (isNaN(m) || m < 0)) errs.minThreshold = true;
  return errs;
}

type Props = {
  onSaved?: (count: number) => void;
};

export function BulkStockGrid({ onSaved }: Props) {
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: DEFAULT_ROWS }, makeEmptyRow));
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const cellRefs = useRef<Map<string, HTMLInputElement | HTMLSelectElement | null>>(new Map());

  const keyOf = (row: number, col: number) => `${row}-${col}`;

  const registerRef = useCallback(
    (row: number, col: number) => (el: HTMLInputElement | HTMLSelectElement | null) => {
      cellRefs.current.set(keyOf(row, col), el);
    },
    []
  );

  const focusCell = useCallback((pos: CellPos) => {
    const el = cellRefs.current.get(keyOf(pos.row, pos.col));
    if (el) {
      el.focus();
      if (el instanceof HTMLInputElement) el.select();
    }
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, makeEmptyRow()]);
  }, []);

  const deleteRow = useCallback((idx: number) => {
    setRows((prev) => (prev.length <= 1 ? [makeEmptyRow()] : prev.filter((_, i) => i !== idx)));
  }, []);

  const updateCell = useCallback(
    (rowIdx: number, col: ColKey, value: string) => {
      setRows((prev) => {
        const next = prev.map((r, i) => (i === rowIdx ? { ...r, [col]: value } : r));
        // Auto-add a new empty row when the last row becomes filled
        const lastRow = next[next.length - 1];
        if (isRowFilled(lastRow)) next.push(makeEmptyRow());
        return next;
      });
    },
    []
  );

  const handleEnterAtLastCell = useCallback(() => {
    setRows((prev) => {
      const next = [...prev, makeEmptyRow()];
      setTimeout(() => focusCell({ row: next.length - 1, col: 0 }), 0);
      return next;
    });
  }, [focusCell]);

  const rowCount = rows.length;

  const onKey = useKeyboardNavigation({
    rowCount,
    colCount: COL_COUNT,
    focusCell,
    onEnterAtLastCell: handleEnterAtLastCell,
    onBackspaceEmptyRow: deleteRow,
  });

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement | HTMLSelectElement>, startRow: number, startCol: number) => {
      const text = e.clipboardData.getData("text/plain");
      if (!text || (!text.includes("\t") && !text.includes("\n"))) return;

      e.preventDefault();
      const parsed = parseClipboardData(text);
      if (!parsed.length) return;

      setRows((prev) => {
        const next = prev.map((r) => ({ ...r }));
        parsed.forEach((cells, rOff) => {
          const targetRow = startRow + rOff;
          while (next.length <= targetRow) next.push(makeEmptyRow());
          cells.forEach((raw, cOff) => {
            const c = startCol + cOff;
            if (c >= COL_COUNT) return;
            const key = COLUMNS[c];
            const value = raw.trim();
            (next[targetRow] as Row)[key] =
              key === "category" ? matchCategory(value) : value;
          });
        });
        // Ensure trailing empty row
        if (!isRowEmpty(next[next.length - 1])) next.push(makeEmptyRow());
        return next;
      });
    },
    []
  );

  const rowErrors = useMemo(() => rows.map(validateRow), [rows]);

  const stats = useMemo(() => {
    let valid = 0;
    let invalid = 0;
    let incomplete = 0;
    rows.forEach((r, i) => {
      if (isRowEmpty(r)) return;
      const errs = rowErrors[i];
      if (Object.keys(errs).length > 0) invalid++;
      else if (!isRowFilled(r)) incomplete++;
      else valid++;
    });
    return { valid, invalid, incomplete };
  }, [rows, rowErrors]);

  const canSave = stats.valid > 0 && stats.invalid === 0 && !saving;

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    setBanner(null);

    const payload = rows
      .filter((r, i) => !isRowEmpty(r) && Object.keys(rowErrors[i]).length === 0 && isRowFilled(r))
      .map((r) => ({
        name: r.name.trim(),
        category: r.category,
        quantity: Number(r.quantity),
        unit: r.unit.trim() || "pcs",
        minThreshold: Number(r.minThreshold) || 0,
      }));

    try {
      const res = await fetch("/api/admin/dept/stock/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Save failed");

      setBanner({ kind: "success", text: `Saved ${json.data.inserted} item${json.data.inserted === 1 ? "" : "s"}.` });
      setRows(Array.from({ length: DEFAULT_ROWS }, makeEmptyRow));
      onSaved?.(json.data.inserted);
    } catch (err) {
      setBanner({ kind: "error", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }, [canSave, rows, rowErrors, onSaved]);

  return (
    <div className="space-y-3">
      {/* Stats + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            {stats.valid} valid
          </span>
          {stats.invalid > 0 && (
            <span className="px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
              {stats.invalid} invalid
            </span>
          )}
          {stats.incomplete > 0 && (
            <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
              {stats.incomplete} incomplete
            </span>
          )}
          <span className="text-slate-500 dark:text-slate-400">
            Tab/Enter to move · Paste from Excel supported
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Row
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>

      {banner && (
        <div
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border ${
            banner.kind === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
          }`}
        >
          {banner.kind === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {banner.text}
        </div>
      )}

      {/* Grid */}
      <div className="overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 max-h-[65vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="w-10 px-2 py-2 text-center font-medium border-b border-slate-200 dark:border-slate-700">#</th>
              <th className="px-2 py-2 text-left font-medium border-b border-slate-200 dark:border-slate-700 min-w-[200px]">Item Name</th>
              <th className="px-2 py-2 text-left font-medium border-b border-slate-200 dark:border-slate-700 min-w-[180px]">Category</th>
              <th className="px-2 py-2 text-left font-medium border-b border-slate-200 dark:border-slate-700 w-[110px]">Quantity</th>
              <th className="px-2 py-2 text-left font-medium border-b border-slate-200 dark:border-slate-700 w-[100px]">Unit</th>
              <th className="px-2 py-2 text-left font-medium border-b border-slate-200 dark:border-slate-700 w-[130px]">Min Threshold</th>
              <th className="w-10 px-2 py-2 border-b border-slate-200 dark:border-slate-700"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => {
              const errs = rowErrors[rIdx];
              const empty = isRowEmpty(row);
              const filled = isRowFilled(row);
              const incompleteBg = !empty && !filled ? "bg-amber-50/40 dark:bg-amber-950/20" : "";
              return (
                <tr
                  key={rIdx}
                  className={`group border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 ${incompleteBg}`}
                >
                  <td className="text-center text-xs text-slate-400 dark:text-slate-500 font-mono px-1">
                    {rIdx + 1}
                  </td>
                  <td className="border-l border-slate-100 dark:border-slate-800">
                    <EditableCell
                      ref={registerRef(rIdx, 0)}
                      kind="text"
                      value={row.name}
                      placeholder="e.g. Bond paper A4"
                      invalid={errs.name}
                      onChange={(v) => updateCell(rIdx, "name", v)}
                      onKeyDown={(e) =>
                        onKey(e, { row: rIdx, col: 0 }, empty, row.name === "")
                      }
                      onPaste={(e) => handlePaste(e, rIdx, 0)}
                    />
                  </td>
                  <td className="border-l border-slate-100 dark:border-slate-800">
                    <EditableCell
                      ref={registerRef(rIdx, 1)}
                      kind="select"
                      options={CATEGORIES}
                      value={row.category}
                      placeholder="Select category"
                      invalid={errs.category}
                      onChange={(v) => updateCell(rIdx, "category", v)}
                      onKeyDown={(e) =>
                        onKey(e, { row: rIdx, col: 1 }, empty, row.category === "")
                      }
                    />
                  </td>
                  <td className="border-l border-slate-100 dark:border-slate-800">
                    <EditableCell
                      ref={registerRef(rIdx, 2)}
                      kind="number"
                      min={0}
                      value={row.quantity}
                      placeholder="0"
                      invalid={errs.quantity}
                      onChange={(v) => {
                        // prevent negative quantities
                        if (v.startsWith("-")) return;
                        updateCell(rIdx, "quantity", v);
                      }}
                      onKeyDown={(e) =>
                        onKey(e, { row: rIdx, col: 2 }, empty, row.quantity === "")
                      }
                      onPaste={(e) => handlePaste(e, rIdx, 2)}
                    />
                  </td>
                  <td className="border-l border-slate-100 dark:border-slate-800">
                    <EditableCell
                      ref={registerRef(rIdx, 3)}
                      kind="text"
                      value={row.unit}
                      placeholder="pcs"
                      invalid={errs.unit}
                      onChange={(v) => updateCell(rIdx, "unit", v)}
                      onKeyDown={(e) =>
                        onKey(e, { row: rIdx, col: 3 }, empty, row.unit === "")
                      }
                      onPaste={(e) => handlePaste(e, rIdx, 3)}
                    />
                  </td>
                  <td className="border-l border-slate-100 dark:border-slate-800">
                    <EditableCell
                      ref={registerRef(rIdx, 4)}
                      kind="number"
                      min={0}
                      value={row.minThreshold}
                      placeholder="0"
                      invalid={errs.minThreshold}
                      onChange={(v) => {
                        if (v.startsWith("-")) return;
                        updateCell(rIdx, "minThreshold", v);
                      }}
                      onKeyDown={(e) =>
                        onKey(e, { row: rIdx, col: 4 }, empty, row.minThreshold === "")
                      }
                      onPaste={(e) => handlePaste(e, rIdx, 4)}
                    />
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      onClick={() => deleteRow(rIdx)}
                      className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Tip: copy rows from Excel/Sheets and paste into any cell — columns map to Item Name, Category, Quantity, Unit, Min Threshold.
        Suggested units: {UNITS_SUGGEST.join(", ")}.
      </p>
    </div>
  );
}

function matchCategory(value: string): string {
  const v = value.trim().toLowerCase();
  if (!v) return "";
  const exact = (CATEGORIES as readonly string[]).find((c) => c.toLowerCase() === v);
  if (exact) return exact;
  const partial = (CATEGORIES as readonly string[]).find((c) => c.toLowerCase().startsWith(v));
  return partial ?? value;
}
