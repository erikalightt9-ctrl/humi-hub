"use client";

import {
  useCallback, useEffect, useMemo, useRef, useState,
  type ClipboardEvent, type KeyboardEvent,
} from "react";
import { Plus, Save, Loader2, AlertTriangle, CheckCircle, X, Trash2, RefreshCw } from "lucide-react";

/* ─────────────────────────── Types ─────────────────────────── */

type ApiItem = {
  id: string;
  name: string;
  unit: string;
  totalStock: string;
  minThreshold: string;
};

type GridRow = {
  key: string;
  itemId: string | null;   // null = new item row
  name: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  qty: string;             // signed: positive = IN, negative = OUT
  unitCost: string;
  supplier: string;
  note: string;
};

type ColKey = "name" | "qty" | "unitCost" | "supplier" | "note";
const COLS: ColKey[] = ["name", "qty", "unitCost", "supplier", "note"];
const COL_COUNT = COLS.length;
const NEW_EMPTY_ROWS = 3;

/* ─────────────────────────── Helpers ─────────────────────────── */

let _uid = 0;
const newKey = () => `r${++_uid}`;

function fromApi(item: ApiItem): GridRow {
  return {
    key: item.id,
    itemId: item.id,
    name: item.name,
    unit: item.unit,
    currentStock: Number(item.totalStock),
    minThreshold: Number(item.minThreshold),
    qty: "",
    unitCost: "",
    supplier: "",
    note: "",
  };
}

function emptyNew(): GridRow {
  return {
    key: newKey(),
    itemId: null,
    name: "",
    unit: "pcs",
    currentStock: 0,
    minThreshold: 0,
    qty: "",
    unitCost: "",
    supplier: "",
    note: "",
  };
}

function isDirty(r: GridRow): boolean {
  const q = parseFloat(r.qty);
  if (r.itemId !== null) return r.qty.trim() !== "" && !isNaN(q) && q !== 0;
  return r.name.trim() !== "" || r.qty.trim() !== "";
}

function isValidRow(r: GridRow): boolean {
  const q = parseFloat(r.qty);
  if (r.itemId !== null) {
    if (r.qty.trim() === "") return true;               // blank = skip, that's fine
    if (isNaN(q) || q === 0) return false;
    return r.currentStock + q >= 0;                     // stock can't go negative
  }
  if (!r.name.trim()) return false;
  return r.qty.trim() === "" || (!isNaN(q) && q >= 0); // new items qty must be >= 0
}

function computedStock(r: GridRow) {
  return r.currentStock + (parseFloat(r.qty) || 0);
}

function statusBadge(stock: number, min: number) {
  if (stock < 0)
    return { label: "Invalid",      cls: "bg-red-200 text-red-800 dark:bg-red-900/60 dark:text-red-200" };
  if (stock === 0)
    return { label: "Out of Stock", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" };
  if (min > 0 && stock <= min)
    return { label: "Low Stock",    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
  return   { label: "In Stock",    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" };
}

/* ─────────────────────────── Component ─────────────────────────── */

type Props = { categoryId: string; onSaved?: () => void };

export function CategoryBulkGrid({ categoryId, onSaved }: Props) {
  const [items,   setItems]   = useState<ApiItem[]>([]);
  const [rows,    setRows]    = useState<GridRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [banner,  setBanner]  = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // keep a ref so keyboard callbacks don't go stale
  const rowsRef = useRef<GridRow[]>([]);
  useEffect(() => { rowsRef.current = rows; }, [rows]);

  // cell input refs for programmatic focus
  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const regRef = (ri: number, ci: number) => (el: HTMLInputElement | null) => {
    const k = `${ri}-${ci}`;
    if (el) cellRefs.current.set(k, el);
    else    cellRefs.current.delete(k);
  };

  /* ── data loading ── */

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/inventory/items?categoryId=${categoryId}`);
      const json = await res.json();
      if (json.success) {
        const apiItems: ApiItem[] = json.data;
        setItems(apiItems);
        setRows([
          ...apiItems.map(fromApi),
          ...Array.from({ length: NEW_EMPTY_ROWS }, emptyNew),
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => { void loadItems(); }, [loadItems]);

  /* ── keyboard navigation ── */

  const focusCell = useCallback((ri: number, ci: number) => {
    const el = cellRefs.current.get(`${ri}-${ci}`);
    if (el) { el.focus(); el.select(); }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, ri: number, ci: number, row: GridRow) => {
      const rowCount = rowsRef.current.length;

      const appendAndFocus = (targetCol: number) => {
        setRows((prev) => {
          const next = [...prev, emptyNew()];
          setTimeout(() => focusCell(next.length - 1, targetCol), 0);
          return next;
        });
      };

      switch (e.key) {
        case "Tab": {
          e.preventDefault();
          if (!e.shiftKey) {
            if (ci < COL_COUNT - 1) focusCell(ri, ci + 1);
            else if (ri < rowCount - 1) focusCell(ri + 1, 0);
            else appendAndFocus(0);
          } else {
            if (ci > 0) focusCell(ri, ci - 1);
            else if (ri > 0) focusCell(ri - 1, COL_COUNT - 1);
          }
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (ri < rowCount - 1) focusCell(ri + 1, ci);
          else appendAndFocus(ci);
          break;
        }
        case "ArrowUp": {
          if (ri > 0) { e.preventDefault(); focusCell(ri - 1, ci); }
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          if (ri < rowCount - 1) focusCell(ri + 1, ci);
          else appendAndFocus(ci);
          break;
        }
        case "ArrowLeft": {
          if (ci > 0 && (e.target as HTMLInputElement).selectionStart === 0) {
            e.preventDefault(); focusCell(ri, ci - 1);
          }
          break;
        }
        case "ArrowRight": {
          const inp = e.target as HTMLInputElement;
          if (ci < COL_COUNT - 1 && inp.selectionStart === inp.value.length) {
            e.preventDefault(); focusCell(ri, ci + 1);
          }
          break;
        }
        case "Backspace": {
          // delete empty new-item rows
          if (row.itemId === null && !row.name && !row.qty) {
            e.preventDefault();
            setRows((prev) => {
              if (prev.length <= 1) return prev;
              const next = prev.filter((_, i) => i !== ri);
              setTimeout(() => focusCell(Math.max(0, ri - 1), ci), 0);
              return next;
            });
          }
          break;
        }
      }
    },
    [focusCell]
  );

  /* ── paste from Excel / Google Sheets ── */

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>, startRow: number, startCol: number) => {
      const text = e.clipboardData.getData("text/plain");
      if (!text || (!text.includes("\t") && !text.includes("\n"))) return;
      e.preventDefault();

      const lines   = text.split(/\r?\n/).filter((l) => l.trim());
      const parsed  = lines.map((l) => l.split("\t"));

      setRows((prev) => {
        const next = [...prev];
        parsed.forEach((cells, rOff) => {
          const ri = startRow + rOff;
          while (next.length <= ri) next.push(emptyNew());

          cells.forEach((val, cOff) => {
            const ci  = startCol + cOff;
            if (ci >= COL_COUNT) return;
            const col = COLS[ci];
            if (col === "name" && next[ri].itemId !== null) return; // don't rename existing items
            next[ri] = { ...next[ri], [col]: val.trim() };
          });
        });

        const last = next[next.length - 1];
        if (last.itemId !== null || last.name || last.qty) next.push(emptyNew());
        return next;
      });
    },
    []
  );

  /* ── cell updates ── */

  const updateCell = useCallback((ri: number, col: ColKey, val: string) => {
    setRows((prev) => prev.map((r, i) => (i === ri ? { ...r, [col]: val } : r)));
  }, []);

  const deleteRow = useCallback((ri: number) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== ri);
    });
  }, []);

  const clearChanges = useCallback(() => {
    setRows((prev) =>
      prev.map((r) => ({ ...r, qty: "", unitCost: "", supplier: "", note: "" }))
    );
    setBanner(null);
  }, []);

  /* ── derived state ── */

  const dirtyRows = useMemo(() => rows.filter(isDirty), [rows]);
  const hasInvalid = useMemo(() => dirtyRows.some((r) => !isValidRow(r)), [dirtyRows]);
  const canSave = dirtyRows.length > 0 && !hasInvalid && !saving;

  const totalCurrent = useMemo(
    () => items.reduce((s, it) => s + Number(it.totalStock), 0),
    [items]
  );
  const totalAfter = useMemo(
    () =>
      rows.reduce(
        (s, r) => s + (r.itemId !== null ? r.currentStock : 0) + (parseFloat(r.qty) || 0),
        0
      ),
    [rows]
  );

  /* ── save ── */

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    setBanner(null);

    const payload = {
      categoryId,
      rows: dirtyRows.map((r) => ({
        itemId:   r.itemId ?? undefined,
        name:     r.itemId ? undefined : r.name.trim() || undefined,
        unit:     r.itemId ? undefined : r.unit || "pcs",
        qty:      parseFloat(r.qty) || 0,
        unitCost: r.unitCost ? parseFloat(r.unitCost) : undefined,
        supplier: r.supplier.trim() || undefined,
        note:     r.note.trim() || undefined,
      })),
    };

    try {
      const res  = await fetch("/api/admin/inventory/movements/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Save failed");

      setBanner({
        kind: "success",
        text: `${json.data.saved} change${json.data.saved === 1 ? "" : "s"} applied.`,
      });
      await loadItems();
      onSaved?.();
    } catch (err) {
      setBanner({ kind: "error", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }, [canSave, categoryId, dirtyRows, loadItems, onSaved]);

  /* ─────────────────────────── Render ─────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-14">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const inputBase =
    "w-full h-full px-2 py-1.5 text-sm bg-transparent outline-none " +
    "focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 " +
    "rounded-sm transition-colors";
  const readOnlyBase =
    `${inputBase} bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 cursor-default select-none`;
  const cellBorder = "border-l border-slate-100 dark:border-slate-800";

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`px-2 py-1 rounded-md border font-medium ${
              dirtyRows.length > 0
                ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                : "bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
            }`}
          >
            {dirtyRows.length} pending {dirtyRows.length === 1 ? "change" : "changes"}
          </span>
          {hasInvalid && (
            <span className="px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
              Fix invalid rows
            </span>
          )}
          <span className="hidden md:inline text-slate-400 dark:text-slate-500">
            Tab/Enter · Arrow keys · Paste from Excel · <span className="font-medium">+qty = IN</span> · <span className="font-medium">−qty = OUT</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadItems()}
            title="Reload items"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {dirtyRows.length > 0 && (
            <button
              onClick={clearChanges}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
          <button
            onClick={() => setRows((p) => [...p, emptyNew()])}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Row
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={!canSave}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Apply Changes"}
          </button>
        </div>
      </div>

      {/* ── Banner ── */}
      {banner && (
        <div
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border ${
            banner.kind === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
          }`}
        >
          {banner.kind === "success"
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {banner.text}
        </div>
      )}

      {/* ── Grid ── */}
      <div className="overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 max-h-[60vh]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <tr>
              <th className="w-9 px-2 py-2.5 text-center font-medium border-b border-slate-200 dark:border-slate-700">#</th>
              <th className="px-2 py-2.5 text-left font-medium border-b border-slate-200 dark:border-slate-700 min-w-[200px]">Item Name</th>
              <th className="px-2 py-2.5 text-right font-medium border-b border-slate-200 dark:border-slate-700 w-[115px]">Current Stock</th>
              <th className="px-2 py-2.5 text-left font-medium border-b border-slate-200 dark:border-slate-700 w-[105px]">
                Qty Change
                <span className="ml-1 text-[10px] font-normal text-slate-400 dark:text-slate-500">(+/−)</span>
              </th>
              <th className="px-2 py-2.5 text-left font-medium border-b border-slate-200 dark:border-slate-700 w-[100px]">Unit Cost</th>
              <th className="px-2 py-2.5 text-left font-medium border-b border-slate-200 dark:border-slate-700 min-w-[140px]">Supplier</th>
              <th className="px-2 py-2.5 text-left font-medium border-b border-slate-200 dark:border-slate-700 min-w-[140px]">Note</th>
              <th className="px-2 py-2.5 text-right font-medium border-b border-slate-200 dark:border-slate-700 w-[110px]">New Stock</th>
              <th className="px-2 py-2.5 text-left font-medium border-b border-slate-200 dark:border-slate-700 w-[110px]">Status</th>
              <th className="w-8 border-b border-slate-200 dark:border-slate-700" />
            </tr>
          </thead>

          <tbody>
            {rows.map((row, ri) => {
              const dirty     = isDirty(row);
              const valid     = !dirty || isValidRow(row);
              const ns        = computedStock(row);
              const st        = statusBadge(ns, row.minThreshold);
              const isExist   = row.itemId !== null;
              const showNew   = dirty || (!isExist && row.qty);
              const rowBg     = !valid
                ? "bg-red-50/60 dark:bg-red-950/20"
                : dirty
                ? "bg-amber-50/30 dark:bg-amber-950/10"
                : "";

              return (
                <tr
                  key={row.key}
                  className={`group border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors ${rowBg}`}
                >
                  {/* Row # */}
                  <td className="text-center text-xs text-slate-400 dark:text-slate-500 font-mono px-1 select-none">
                    {isExist ? ri + 1 : <span className="text-indigo-400 dark:text-indigo-500 font-semibold">+</span>}
                  </td>

                  {/* Name */}
                  <td className={cellBorder}>
                    <input
                      ref={regRef(ri, 0)}
                      readOnly={isExist}
                      value={row.name}
                      placeholder={isExist ? "" : "New item name…"}
                      onChange={(e) => !isExist && updateCell(ri, "name", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, ri, 0, row)}
                      onPaste={(e) => handlePaste(e, ri, 0)}
                      className={
                        isExist
                          ? readOnlyBase
                          : `${inputBase} ${!row.name && dirty ? "ring-2 ring-inset ring-red-400 bg-red-50 dark:bg-red-950/30" : ""}`
                      }
                    />
                  </td>

                  {/* Current Stock — read-only display */}
                  <td className="px-3 py-1.5 text-right tabular-nums text-slate-500 dark:text-slate-400 select-none">
                    {isExist
                      ? <><span className="font-medium text-slate-700 dark:text-slate-200">{row.currentStock}</span>{" "}<span className="text-xs">{row.unit}</span></>
                      : <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>

                  {/* Qty Change */}
                  <td className={`${cellBorder} ${dirty && !valid ? "bg-red-50/80 dark:bg-red-950/30" : ""}`}>
                    <input
                      ref={regRef(ri, 1)}
                      type="number"
                      step="any"
                      value={row.qty}
                      placeholder={isExist ? "+/−" : "0"}
                      onChange={(e) => updateCell(ri, "qty", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, ri, 1, row)}
                      onPaste={(e) => handlePaste(e, ri, 1)}
                      className={`${inputBase} ${dirty && !valid ? "text-red-600 dark:text-red-400" : dirty && Number(row.qty) > 0 ? "text-emerald-700 dark:text-emerald-400 font-medium" : dirty && Number(row.qty) < 0 ? "text-red-600 dark:text-red-400 font-medium" : ""}`}
                    />
                  </td>

                  {/* Unit Cost */}
                  <td className={cellBorder}>
                    <input
                      ref={regRef(ri, 2)}
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.unitCost}
                      placeholder="—"
                      onChange={(e) => updateCell(ri, "unitCost", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, ri, 2, row)}
                      onPaste={(e) => handlePaste(e, ri, 2)}
                      className={inputBase}
                    />
                  </td>

                  {/* Supplier */}
                  <td className={cellBorder}>
                    <input
                      ref={regRef(ri, 3)}
                      value={row.supplier}
                      placeholder="—"
                      onChange={(e) => updateCell(ri, "supplier", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, ri, 3, row)}
                      onPaste={(e) => handlePaste(e, ri, 3)}
                      className={inputBase}
                    />
                  </td>

                  {/* Note */}
                  <td className={cellBorder}>
                    <input
                      ref={regRef(ri, 4)}
                      value={row.note}
                      placeholder="—"
                      onChange={(e) => updateCell(ri, "note", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, ri, 4, row)}
                      onPaste={(e) => handlePaste(e, ri, 4)}
                      className={inputBase}
                    />
                  </td>

                  {/* New Stock — computed */}
                  <td className="px-3 py-1.5 text-right tabular-nums select-none">
                    {showNew ? (
                      <span className={`font-semibold ${ns < 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
                        {ns}
                        {" "}<span className="text-[11px] font-normal text-slate-400">{row.unit}</span>
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>

                  {/* Status badge */}
                  <td className="px-2 py-1.5 select-none">
                    {showNew ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Delete new rows */}
                  <td className="text-center px-1">
                    {!isExist && (
                      <button
                        onClick={() => deleteRow(ri)}
                        tabIndex={-1}
                        className="p-1 rounded text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove row"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* ── Summary footer ── */}
          {items.length > 0 && (
            <tfoot className="sticky bottom-0 bg-slate-50 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-700">
              <tr>
                <td colSpan={2} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Total — {items.length} item{items.length !== 1 ? "s" : ""}
                </td>
                <td className="px-3 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                  {totalCurrent}
                </td>
                <td colSpan={4} />
                <td className="px-3 py-2 text-right text-xs font-semibold tabular-nums">
                  <span className={totalAfter !== totalCurrent ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300"}>
                    {totalAfter}
                  </span>
                  {totalAfter !== totalCurrent && (
                    <span className={`ml-1 ${totalAfter > totalCurrent ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                      ({totalAfter > totalCurrent ? "+" : ""}{totalAfter - totalCurrent})
                    </span>
                  )}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        Paste from Excel/Sheets: columns map to <strong>Item Name → Qty Change → Unit Cost → Supplier → Note</strong>.
        Positive qty adds stock (IN), negative removes stock (OUT). Blank rows are skipped.
      </p>
    </div>
  );
}
