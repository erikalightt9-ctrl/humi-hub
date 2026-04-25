"use client";

import Link from "next/link";
import { useEffect, useState, FormEvent, use } from "react";
import {
  ArrowLeft, Loader2, Edit2, Trash2, Package, X,
  ArrowUpRight, ArrowDownRight, SlidersHorizontal, History, Search,
} from "lucide-react";
import { BulkStockGrid } from "@/components/admin/bulk-stock/BulkStockGrid";

type Category = { id: string; name: string; icon: string | null; description: string | null };

type Item = {
  id: string;
  categoryId: string;
  name: string;
  sku: string | null;
  unit: string;
  description: string | null;
  minThreshold: string;
  totalStock: string;
  location: string | null;
  updatedAt: string;
};

type Movement = {
  id: string;
  type: string;
  quantity: string;
  note: string | null;
  supplier: string | null;
  createdAt: string;
  item: { id: string; name: string; unit: string };
};

const EMPTY_ITEM = { name: "", sku: "", unit: "pcs", description: "", minThreshold: "0", location: "", initialQty: "0", supplier: "", unitCost: "" };

export default function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: categoryId } = use(params);

  const [category, setCategory] = useState<Category | null>(null);
  const [items, setItems]       = useState<Item[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  const [itemModal, setItemModal]       = useState<{ mode: "edit"; row: Item } | null>(null);
  const [itemForm, setItemForm]         = useState(EMPTY_ITEM);
  const [savingItem, setSavingItem]     = useState(false);

  const [stockModal, setStockModal]     = useState<{ item: Item; type: "IN" | "OUT" | "ADJUST" } | null>(null);
  const [stockForm, setStockForm]       = useState({ quantity: "", unitCost: "", supplier: "", note: "" });
  const [savingStock, setSavingStock]   = useState(false);

  const [historyFor, setHistoryFor]     = useState<Item | null>(null);
  const [history, setHistory]           = useState<Movement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const loadCategory = async () => {
    const res = await fetch(`/api/admin/inventory/categories`);
    const json = await res.json();
    if (json.success) {
      const match = (json.data as Category[]).find((c) => c.id === categoryId);
      setCategory(match ?? null);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    const url = `/api/admin/inventory/items?categoryId=${categoryId}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.success) setItems(json.data);
    setLoading(false);
  };

  useEffect(() => { void loadCategory(); }, [categoryId]);
  useEffect(() => { void loadItems(); }, [categoryId, search]);

  const openEditItem = (row: Item) => {
    setItemForm({
      name: row.name, sku: row.sku ?? "", unit: row.unit,
      description: row.description ?? "", minThreshold: String(row.minThreshold),
      location: row.location ?? "", initialQty: "0", supplier: "", unitCost: "",
    });
    setItemModal({ mode: "edit", row });
  };

  const handleSaveItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!itemModal) return;
    setSavingItem(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/admin/inventory/items?id=${itemModal.row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: itemForm.name,
          sku: itemForm.sku || undefined,
          unit: itemForm.unit,
          description: itemForm.description || undefined,
          minThreshold: Number(itemForm.minThreshold) || 0,
          location: itemForm.location || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Save failed");
      setBanner({ kind: "success", text: "Item updated" });
      setItemModal(null);
      await loadItems();
    } catch (err) {
      setBanner({ kind: "error", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (row: Item) => {
    if (!confirm(`Delete "${row.name}"? All stock movements will also be deleted.`)) return;
    const res = await fetch(`/api/admin/inventory/items?id=${row.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) { setBanner({ kind: "error", text: json.error || "Delete failed" }); return; }
    setBanner({ kind: "success", text: "Item deleted" });
    await loadItems();
  };

  const openStock = (item: Item, type: "IN" | "OUT" | "ADJUST") => {
    setStockForm({ quantity: "", unitCost: "", supplier: "", note: "" });
    setStockModal({ item, type });
  };

  const handleSaveStock = async (e: FormEvent) => {
    e.preventDefault();
    if (!stockModal) return;
    setSavingStock(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: stockModal.item.id,
          type: stockModal.type,
          quantity: Number(stockForm.quantity),
          unitCost: stockForm.unitCost ? Number(stockForm.unitCost) : undefined,
          supplier: stockForm.supplier || undefined,
          note: stockForm.note || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Save failed");
      setBanner({ kind: "success", text: `Stock updated for ${stockModal.item.name}` });
      setStockModal(null);
      await loadItems();
    } catch (err) {
      setBanner({ kind: "error", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSavingStock(false);
    }
  };

  const openHistory = async (item: Item) => {
    setHistoryFor(item);
    setHistoryLoading(true);
    setHistory([]);
    const res = await fetch(`/api/admin/inventory/movements?itemId=${item.id}&limit=100`);
    const json = await res.json();
    if (json.success) setHistory(json.data);
    setHistoryLoading(false);
  };

  const statusOf = (item: Item) => {
    const q = Number(item.totalStock);
    const m = Number(item.minThreshold);
    if (q === 0) return { label: "Out of Stock", cls: "bg-red-100 text-red-700" };
    if (m > 0 && q <= m) return { label: "Low Stock", cls: "bg-amber-100 text-amber-700" };
    return { label: "In Stock", cls: "bg-emerald-100 text-emerald-700" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin/admin/inventory"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Inventory
          </Link>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-2xl">{category?.icon ?? "📋"}</span>
            {category?.name ?? "Loading..."}
          </h1>
          {category?.description && (
            <p className="text-sm text-slate-500 mt-0.5">{category.description}</p>
          )}
        </div>
      </div>

      {banner && (
        <div className={`px-3 py-2 text-sm rounded-lg border ${
          banner.kind === "success"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {banner.text}
        </div>
      )}

      {/* Bulk entry — primary view, loads immediately */}
      <BulkStockGrid
        categoryId={categoryId}
        onSaved={() => void loadItems()}
      />

      {/* Current stock — secondary, below the grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-700">Current Stock</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
            <Package className="h-7 w-7 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-slate-500">
              {search ? "No items match your search." : "No items yet — use the grid above to add stock."}
            </p>
          </div>
        ) : (
          <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium">Item</th>
                  <th className="text-right px-3 py-2.5 font-medium">Stock</th>
                  <th className="text-right px-3 py-2.5 font-medium">Min</th>
                  <th className="text-left px-3 py-2.5 font-medium">Status</th>
                  <th className="text-left px-3 py-2.5 font-medium">Location</th>
                  <th className="text-right px-3 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const st = statusOf(it);
                  return (
                    <tr key={it.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-slate-900">{it.name}</p>
                        {it.description && <p className="text-[11px] text-slate-500 truncate max-w-xs">{it.description}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                        {Number(it.totalStock)} <span className="text-xs text-slate-400 font-normal">{it.unit}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">{Number(it.minThreshold)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{it.location ?? "—"}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openStock(it, "IN")} title="Stock In" className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50">
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openStock(it, "OUT")} title="Stock Out" className="p-1.5 rounded-md text-red-600 hover:bg-red-50">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openStock(it, "ADJUST")} title="Adjust" className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openHistory(it)} title="History" className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100">
                            <History className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openEditItem(it)} title="Edit" className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteItem(it)} title="Delete" className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit item modal */}
      {itemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => !savingItem && setItemModal(null)}>
          <form onSubmit={handleSaveItem} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">Edit Item</h2>
              <button type="button" onClick={() => !savingItem && setItemModal(null)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <Field label="Name" required>
                <input required value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="SKU"><input value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })} className={inputCls} placeholder="Optional" /></Field>
                <Field label="Unit"><input value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} className={inputCls} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Min Threshold"><input type="number" min="0" value={itemForm.minThreshold} onChange={(e) => setItemForm({ ...itemForm, minThreshold: e.target.value })} className={inputCls} /></Field>
                <Field label="Location"><input value={itemForm.location} onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })} className={inputCls} placeholder="Optional" /></Field>
              </div>
              <Field label="Description">
                <textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
              </Field>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 sticky bottom-0 bg-white">
              <button type="button" onClick={() => setItemModal(null)} disabled={savingItem} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={savingItem} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-medium">
                {savingItem && <Loader2 className="h-4 w-4 animate-spin" />}
                {savingItem ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stock movement modal */}
      {stockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => !savingStock && setStockModal(null)}>
          <form onSubmit={handleSaveStock} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {stockModal.type === "IN" ? "Add Stock" : stockModal.type === "OUT" ? "Deduct Stock" : "Adjust Stock"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {stockModal.item.name} · current: <span className="font-semibold tabular-nums">{Number(stockModal.item.totalStock)} {stockModal.item.unit}</span>
                </p>
              </div>
              <button type="button" onClick={() => !savingStock && setStockModal(null)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <Field label={stockModal.type === "ADJUST" ? "Adjustment (+/-)" : "Quantity"} required>
                <input required type="number" step="any" min={stockModal.type === "ADJUST" ? undefined : "0.01"} value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} className={inputCls} placeholder={stockModal.type === "ADJUST" ? "e.g. -5 or 10" : "Qty"} />
              </Field>
              {stockModal.type === "IN" && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Unit Cost"><input type="number" min="0" step="0.01" value={stockForm.unitCost} onChange={(e) => setStockForm({ ...stockForm, unitCost: e.target.value })} className={inputCls} placeholder="—" /></Field>
                  <Field label="Supplier"><input value={stockForm.supplier} onChange={(e) => setStockForm({ ...stockForm, supplier: e.target.value })} className={inputCls} placeholder="—" /></Field>
                </div>
              )}
              <Field label="Note"><textarea value={stockForm.note} onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })} rows={2} className={`${inputCls} resize-none`} placeholder="Optional" /></Field>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200">
              <button type="button" onClick={() => setStockModal(null)} disabled={savingStock} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={savingStock} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-medium">
                {savingStock && <Loader2 className="h-4 w-4 animate-spin" />}
                {savingStock ? "Saving..." : "Confirm"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History drawer */}
      {historyFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setHistoryFor(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Stock History</h2>
                <p className="text-xs text-slate-500 mt-0.5">{historyFor.name}</p>
              </div>
              <button onClick={() => setHistoryFor(null)} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="overflow-auto flex-1 p-4">
              {historyLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
              ) : history.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-10">No movements yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {history.map((m) => {
                    const q = Number(m.quantity);
                    const sign = q > 0 ? "+" : "";
                    const color = m.type === "IN" ? "text-emerald-600" : m.type === "OUT" ? "text-red-600" : "text-indigo-600";
                    return (
                      <li key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800">
                            <span className={color}>{m.type}</span>
                            {m.note && <span className="text-slate-500 font-normal"> · {m.note}</span>}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(m.createdAt).toLocaleString()}
                            {m.supplier && ` · ${m.supplier}`}
                          </p>
                        </div>
                        <p className={`text-sm font-semibold tabular-nums ${color} shrink-0`}>{sign}{q} {m.item.unit}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
