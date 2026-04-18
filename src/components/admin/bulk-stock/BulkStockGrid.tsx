"use client";

import { useCallback, useEffect, useMemo, useRef, useState, ClipboardEvent } from "react";
import { Plus, Trash2, Save, Loader2, AlertTriangle, CheckCircle, Download, X } from "lucide-react";
import { EditableCell } from "./EditableCell";
import { useKeyboardNavigation, CellPos } from "./useKeyboardNavigation";
import { parseClipboardData } from "./parseClipboardData";

type CategoryOption = { id: string; name: string; icon: string | null };

const TODAY = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

type Row = {
  name: string;
  category: string; // stores categoryId
  quantity: string;
  minThreshold: string;
  location: string;
};

const COLUMNS = ["name", "category", "quantity", "minThreshold", "location"] as const;
type ColKey = (typeof COLUMNS)[number];

const COL_COUNT = COLUMNS.length;
const DEFAULT_ROWS = 5;

function makeEmptyRow(): Row {
  return { name: "", category: "", quantity: "", minThreshold: "0", location: "" };
}

function isRowEmpty(r: Row): boolean {
  return !r.name.trim() && !r.category && !r.quantity.trim();
}

function isRowFilled(r: Row): boolean {
  return !!r.name.trim() && !!r.category && r.quantity.trim() !== "";
}

type CellError = { name?: boolean; category?: boolean; quantity?: boolean; minThreshold?: boolean };

function validateRow(r: Row, categoryIds: Set<string>): CellError {
  const errs: CellError = {};
  const isEmpty = isRowEmpty(r);
  if (isEmpty) return errs;
  if (!r.name.trim()) errs.name = true;
  if (!r.category || !categoryIds.has(r.category)) errs.category = true;
  const q = Number(r.quantity);
  if (r.quantity.trim() === "" || isNaN(q) || q < 0) errs.quantity = true;
  const m = Number(r.minThreshold);
  if (r.minThreshold.trim() !== "" && (isNaN(m) || m < 0)) errs.minThreshold = true;
  return errs;
}

function computeStatus(qty: string, min: string): { label: string; cls: string } {
  const q = Number(qty) || 0;
  const m = Number(min) || 0;
  if (q === 0) return { label: "Out of Stock", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" };
  if (m > 0 && q <= m) return { label: "Low Stock",    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
  return                { label: "In Stock",    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" };
}

type Props = {
  onSaved?: (count: number) => void;
};

const PREVIEW_THRESHOLD = 20;

function downloadCsvTemplate(categoryNames: string[]) {
  const header = "Item Name\tCategory\tQuantity\tMin Threshold\tLocation";
  const firstCat = categoryNames[0] ?? "Stockroom";
  const sample = [
    `Bond paper A4\t${firstCat}\t50\t10\tStorage Room A`,
    `Dishwashing liquid 500ml\t${categoryNames[1] ?? firstCat}\t12\t3\tKitchen Cabinet`,
    `Coffee sachets\t${categoryNames[2] ?? firstCat}\t100\t20\tPantry Shelf 2`,
  ].join("\n");
  const tsv = `${header}\n${sample}\n`;
  const blob = new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bulk-stock-template.tsv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function BulkStockGrid({ onSaved }: Props) {
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: DEFAULT_ROWS }, makeEmptyRow));
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [anchor, setAnchor] = useState<CellPos>({ row: 0, col: 0 });
  const [active, setActive] = useState<CellPos>({ row: 0, col: 0 });
  const dragging = useRef(false);
  const programmatic = useRef(false);

  useEffect(() => {
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/inventory/categories");
        const json = await res.json();
        if (json.success) {
          setCategories((json.data as Array<{ id: string; name: string; icon: string | null }>).map((c) => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
          })));
        }
      } finally {
        setCategoriesLoading(false);
      }
    })();
  }, []);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: `${c.icon ?? "📋"} ${c.name}` })),
    [categories]
  );
  const categoryIdSet = useMemo(() => new Set(categories.map((c) => c.id)), [categories]);
  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);
  const categoryByName = useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(c.name.toLowerCase(), c.id));
    return m;
  }, [categories]);

  const matchCategory = useCallback((value: string): string => {
    const v = value.trim().toLowerCase();
    if (!v) return "";
    if (categoryByName.has(v)) return categoryByName.get(v)!;
    for (const [name, id] of categoryByName.entries()) {
      if (name.startsWith(v)) return id;
    }
    return "";
  }, [categoryByName]);

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
      programmatic.current = true;
      el.focus();
      if (el instanceof HTMLInputElement) el.select();
      setTimeout(() => {
        programmatic.current = false;
      }, 0);
    }
  }, []);

  const handleCellMouseDown = useCallback((r: number, c: number) => {
    dragging.current = true;
    setAnchor({ row: r, col: c });
    setActive({ row: r, col: c });
  }, []);

  const handleCellMouseEnter = useCallback((r: number, c: number) => {
    if (!dragging.current) return;
    setActive({ row: r, col: c });
  }, []);

  const handleCellFocus = useCallback((r: number, c: number) => {
    if (programmatic.current || dragging.current) return;
    setAnchor({ row: r, col: c });
    setActive({ row: r, col: c });
  }, []);

  const moveTo = useCallback(
    (pos: CellPos, extend: boolean) => {
      setActive(pos);
      if (!extend) setAnchor(pos);
      focusCell(pos);
    },
    [focusCell]
  );

  const selectionBounds = useMemo(() => {
    const r1 = Math.min(anchor.row, active.row);
    const r2 = Math.max(anchor.row, active.row);
    const c1 = Math.min(anchor.col, active.col);
    const c2 = Math.max(anchor.col, active.col);
    return { r1, r2, c1, c2, multi: r1 !== r2 || c1 !== c2 };
  }, [anchor, active]);

  const isSelected = useCallback(
    (r: number, c: number) => {
      const { r1, r2, c1, c2 } = selectionBounds;
      return r >= r1 && r <= r2 && c >= c1 && c <= c2;
    },
    [selectionBounds]
  );

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
      setTimeout(() => moveTo({ row: next.length - 1, col: 0 }, false), 0);
      return next;
    });
  }, [moveTo]);

  const rowCount = rows.length;

  const handleCopy = useCallback((): boolean => {
    if (!selectionBounds.multi) return false;
    const { r1, r2, c1, c2 } = selectionBounds;
    const lines: string[] = [];
    for (let r = r1; r <= r2; r++) {
      const cells: string[] = [];
      for (let c = c1; c <= c2; c++) {
        const key = COLUMNS[c];
        cells.push(((rows[r] as Row)[key] ?? "").replace(/\t|\n/g, " "));
      }
      lines.push(cells.join("\t"));
    }
    const tsv = lines.join("\n");
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(tsv);
    }
    return true;
  }, [selectionBounds, rows]);

  const onKey = useKeyboardNavigation({
    rowCount,
    colCount: COL_COUNT,
    moveTo,
    onEnterAtLastCell: handleEnterAtLastCell,
    onBackspaceEmptyRow: deleteRow,
    onCopy: handleCopy,
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

  const rowErrors = useMemo(() => rows.map((r) => validateRow(r, categoryIdSet)), [rows, categoryIdSet]);

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

  const validPayload = useMemo(
    () =>
      rows
        .filter((r, i) => !isRowEmpty(r) && Object.keys(rowErrors[i]).length === 0 && isRowFilled(r))
        .map((r) => ({
          name: r.name.trim(),
          categoryId: r.category,
          categoryName: categories.find((c) => c.id === r.category)?.name ?? "",
          quantity: Number(r.quantity),
          unit: "pcs",
          minThreshold: Number(r.minThreshold) || 0,
          location: r.location.trim() || undefined,
        })),
    [rows, rowErrors, categories]
  );

  const performSave = useCallback(async () => {
    setSaving(true);
    setBanner(null);
    setPreviewOpen(false);

    try {
      const body = {
        rows: validPayload.map((r) => ({
          name: r.name,
          categoryId: r.categoryId,
          quantity: r.quantity,
          minThreshold: r.minThreshold,
          location: r.location,
          unit: r.unit,
        })),
      };
      const res = await fetch("/api/admin/inventory/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
  }, [validPayload, onSaved]);

  const handleSave = useCallback(() => {
    if (!canSave) return;
    if (validPayload.length > PREVIEW_THRESHOLD) {
      setPreviewOpen(true);
      return;
    }
    void performSave();
  }, [canSave, validPayload.length, performSave]);

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 p-8 text-center">
        <AlertTriangle className="h-6 w-6 mx-auto text-amber-500 mb-2" />
        <p className="text-sm text-slate-700 dark:text-slate-200 mb-1 font-medium">No categories yet</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Create at least one category before bulk-entering stock items.</p>
        <a href="/admin/admin/inventory/categories" className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
          Go to Categories
        </a>
      </div>
    );
  }

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
            Tab/Enter to move · Shift+Arrow to select range · Ctrl+C copies TSV · Paste from Excel supported
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCsvTemplate(categoryNames)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Download a TSV template to fill in Excel/Sheets"
          >
            <Download className="h-4 w-4" /> Template
          </button>
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
              <th className="px-2 py-2 text-left font-medium border-b border-slate-200 dark:border-slate-700 min-w-[170px]">Category</th>
              <th className="px-2 py-2 text-left font-medium border-b border-slate-200 dark:border-slate-700 w-[100px]">Quantity</th>
              <th className="px-2 py-2 text-left font-medium border-b border-slate-200 dark:border-slate-700 w-[90px]">Min</th>
              <th className="px-2 py-2 text-left font-medium border-b border-slate-200 dark:border-slate-700 w-[120px]">Status</th>
              <th className="px-2 py-2 text-left font-medium border-b border-slate-200 dark:border-slate-700 min-w-[150px]">Location</th>
              <th className="px-2 py-2 text-left font-medium border-b border-slate-200 dark:border-slate-700 w-[110px]">Last Updated</th>
              <th className="w-10 px-2 py-2 border-b border-slate-200 dark:border-slate-700"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => {
              const errs = rowErrors[rIdx];
              const empty = isRowEmpty(row);
              const filled = isRowFilled(row);
              const incompleteBg = !empty && !filled ? "bg-amber-50/40 dark:bg-amber-950/20" : "";
              const cellTdClass = (c: number) =>
                `border-l border-slate-100 dark:border-slate-800 ${
                  isSelected(rIdx, c) && selectionBounds.multi
                    ? "bg-blue-50 dark:bg-blue-950/40"
                    : ""
                }`;
              return (
                <tr
                  key={rIdx}
                  className={`group border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 ${incompleteBg}`}
                >
                  <td className="text-center text-xs text-slate-400 dark:text-slate-500 font-mono px-1">
                    {rIdx + 1}
                  </td>
                  <td
                    className={cellTdClass(0)}
                    onMouseDown={() => handleCellMouseDown(rIdx, 0)}
                    onMouseEnter={() => handleCellMouseEnter(rIdx, 0)}
                  >
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
                      onFocus={() => handleCellFocus(rIdx, 0)}
                    />
                  </td>
                  <td
                    className={cellTdClass(1)}
                    onMouseDown={() => handleCellMouseDown(rIdx, 1)}
                    onMouseEnter={() => handleCellMouseEnter(rIdx, 1)}
                  >
                    <EditableCell
                      ref={registerRef(rIdx, 1)}
                      kind="select"
                      options={categoryOptions}
                      value={row.category}
                      placeholder="Select category"
                      invalid={errs.category}
                      onChange={(v) => updateCell(rIdx, "category", v)}
                      onKeyDown={(e) =>
                        onKey(e, { row: rIdx, col: 1 }, empty, row.category === "")
                      }
                      onFocus={() => handleCellFocus(rIdx, 1)}
                    />
                  </td>
                  <td
                    className={cellTdClass(2)}
                    onMouseDown={() => handleCellMouseDown(rIdx, 2)}
                    onMouseEnter={() => handleCellMouseEnter(rIdx, 2)}
                  >
                    <EditableCell
                      ref={registerRef(rIdx, 2)}
                      kind="number"
                      min={0}
                      value={row.quantity}
                      placeholder="0"
                      invalid={errs.quantity}
                      onChange={(v) => {
                        if (v.startsWith("-")) return;
                        updateCell(rIdx, "quantity", v);
                      }}
                      onKeyDown={(e) =>
                        onKey(e, { row: rIdx, col: 2 }, empty, row.quantity === "")
                      }
                      onPaste={(e) => handlePaste(e, rIdx, 2)}
                      onFocus={() => handleCellFocus(rIdx, 2)}
                    />
                  </td>
                  <td
                    className={cellTdClass(3)}
                    onMouseDown={() => handleCellMouseDown(rIdx, 3)}
                    onMouseEnter={() => handleCellMouseEnter(rIdx, 3)}
                  >
                    <EditableCell
                      ref={registerRef(rIdx, 3)}
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
                        onKey(e, { row: rIdx, col: 3 }, empty, row.minThreshold === "")
                      }
                      onPaste={(e) => handlePaste(e, rIdx, 3)}
                      onFocus={() => handleCellFocus(rIdx, 3)}
                    />
                  </td>
                  {/* Status — computed, read-only */}
                  <td className="border-l border-slate-100 dark:border-slate-800 px-2">
                    {!empty && row.quantity.trim() !== "" ? (
                      (() => {
                        const st = computeStatus(row.quantity, row.minThreshold);
                        return (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${st.cls}`}>
                            {st.label}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td
                    className={cellTdClass(4)}
                    onMouseDown={() => handleCellMouseDown(rIdx, 4)}
                    onMouseEnter={() => handleCellMouseEnter(rIdx, 4)}
                  >
                    <EditableCell
                      ref={registerRef(rIdx, 4)}
                      kind="text"
                      value={row.location}
                      placeholder="e.g. Storage Room A"
                      onChange={(v) => updateCell(rIdx, "location", v)}
                      onKeyDown={(e) =>
                        onKey(e, { row: rIdx, col: 4 }, empty, row.location === "")
                      }
                      onPaste={(e) => handlePaste(e, rIdx, 4)}
                      onFocus={() => handleCellFocus(rIdx, 4)}
                    />
                  </td>
                  {/* Last Updated — auto today */}
                  <td className="border-l border-slate-100 dark:border-slate-800 px-2 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {!empty ? TODAY : <span className="text-slate-300 dark:text-slate-600">—</span>}
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
        Tip: paste from Excel/Sheets — columns map to Item Name, Category, Quantity, Min Threshold, Location.
        Status and Last Updated are computed automatically.
      </p>

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => !saving && setPreviewOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Confirm bulk save
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  You are about to insert <strong>{validPayload.length}</strong> stock items. Review and confirm.
                </p>
              </div>
              <button
                onClick={() => !saving && setPreviewOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                disabled={saving}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">#</th>
                    <th className="text-left px-3 py-2 font-medium">Name</th>
                    <th className="text-left px-3 py-2 font-medium">Category</th>
                    <th className="text-right px-3 py-2 font-medium">Qty</th>
                    <th className="text-right px-3 py-2 font-medium">Min</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                    <th className="text-left px-3 py-2 font-medium">Location</th>
                    <th className="text-left px-3 py-2 font-medium">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {validPayload.map((r, i) => {
                    const st = computeStatus(String(r.quantity), String(r.minThreshold));
                    return (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-1.5 text-xs text-slate-400 font-mono">{i + 1}</td>
                        <td className="px-3 py-1.5 text-slate-800 dark:text-slate-200">{r.name}</td>
                        <td className="px-3 py-1.5 text-slate-600 dark:text-slate-400">{r.categoryName}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{r.quantity}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{r.minThreshold}</td>
                        <td className="px-3 py-1.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-slate-500">{r.location ?? "—"}</td>
                        <td className="px-3 py-1.5 text-slate-400 text-xs">{TODAY}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setPreviewOpen(false)}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void performSave()}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-medium"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : `Confirm & Save ${validPayload.length}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

