"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Search, X, Loader2, AlertTriangle, Package, CheckCircle,
  Minus, Edit2, Trash2, ChevronDown, Filter,
} from "lucide-react";

/* ─── Types ─── */

const CATEGORIES = [
  "Cleaning Supplies",
  "Pantry Supplies",
  "Maintenance Supplies",
  "Assets",
  "Stockroom Stocks",
] as const;

type Category = (typeof CATEGORIES)[number];

type StockItem = {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  minThreshold: number;
  location: string | null;
  supplier: string | null;
  notes: string | null;
  updatedAt: string;
};

type CategoryStat = { category: Category; count: number; lowStock: number };

/* ─── Helpers ─── */

function getStatus(qty: number, min: number) {
  if (qty === 0)       return { label: "Out of Stock", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" };
  if (min > 0 && qty <= min) return { label: "Low Stock",    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
  return                      { label: "In Stock",    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" };
}

const CAT_COLORS: Record<Category, string> = {
  "Cleaning Supplies":    "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800",
  "Pantry Supplies":      "bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-800",
  "Maintenance Supplies": "bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800",
  "Assets":               "bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800",
  "Stockroom Stocks":     "bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:border-teal-800",
};

const CAT_ICONS: Record<Category, string> = {
  "Cleaning Supplies":    "🧹",
  "Pantry Supplies":      "🍱",
  "Maintenance Supplies": "🔧",
  "Assets":               "📦",
  "Stockroom Stocks":     "🏪",
};

const EMPTY_FORM = {
  name: "", category: "Stockroom Stocks" as Category,
  quantity: "0", unit: "pcs", minThreshold: "0",
  location: "", supplier: "", notes: "",
};

/* ─── Toast ─── */

type Toast = { id: number; message: string; type: "success" | "error" };

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto transition-all ${
          t.type === "success"
            ? "bg-emerald-600 text-white"
            : "bg-red-600 text-white"
        }`}>
          {t.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {t.message}
          <button onClick={() => remove(t.id)} className="ml-2 opacity-70 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
        </div>
      ))}
    </div>
  );
}

/* ─── Stock Modal (Add / Edit) ─── */

function StockModal({
  open, onClose, editing, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: StockItem | null;
  onSaved: (msg: string) => void;
}) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name, category: editing.category,
        quantity: String(editing.quantity), unit: editing.unit,
        minThreshold: String(editing.minThreshold),
        location: editing.location ?? "", supplier: editing.supplier ?? "",
        notes: editing.notes ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [editing, open]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Item name is required."); return; }
    setSaving(true); setError(null);
    try {
      const body = {
        ...form,
        quantity:     parseFloat(form.quantity)     || 0,
        minThreshold: parseFloat(form.minThreshold) || 0,
        location: form.location || undefined,
        supplier: form.supplier || undefined,
        notes:    form.notes    || undefined,
      };
      const url = editing ? `/api/admin/dept/stock?id=${editing.id}` : "/api/admin/dept/stock";
      const res  = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onSaved(editing ? "Item updated." : "Item added to stockroom.");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const inputCls = "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition";
  const labelCls = "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
              <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {editing ? "Edit Stock Item" : "Add Stock Item"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-3 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <div>
            <label className={labelCls}>Item Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Dishwashing Liquid" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Category <span className="text-red-500">*</span></label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Quantity</label>
              <input type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <input value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="pcs, liters, kg" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Min Threshold <span className="text-xs font-normal text-slate-400">(low stock alert)</span></label>
            <input type="number" min="0" step="0.01" value={form.minThreshold} onChange={(e) => set("minThreshold", e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Location</label>
              <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Cabinet A" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Supplier</label>
              <input value={form.supplier} onChange={(e) => set("supplier", e.target.value)} placeholder="Supplier name" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Optional notes" className={inputCls} />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <button onClick={onClose} className="px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-medium transition-colors">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : (editing ? "Save Changes" : "Add Item")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Adjust Modal (Add / Deduct) ─── */

function AdjustModal({
  open, onClose, item, mode, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  item: StockItem | null;
  mode: "add" | "deduct";
  onSaved: (msg: string) => void;
}) {
  const [amount, setAmount]   = useState("1");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => { setAmount("1"); setError(null); }, [open]);

  const handleSave = async () => {
    if (!item) return;
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) { setError("Enter a valid positive amount."); return; }
    setSaving(true); setError(null);
    try {
      const adjustment = mode === "add" ? n : -n;
      const res  = await fetch(`/api/admin/dept/stock?id=${item.id}&adjust=1`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adjustment }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onSaved(mode === "add" ? `Added ${n} ${item.unit} to ${item.name}.` : `Deducted ${n} ${item.unit} from ${item.name}.`);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to adjust");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {mode === "add" ? "➕ Add Stock" : "➖ Deduct Stock"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{item.name}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-3 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-500">
            Current quantity: <span className="font-bold text-slate-900 dark:text-white">{Number(item.quantity).toLocaleString()} {item.unit}</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Amount to {mode === "add" ? "Add" : "Deduct"} <span className="font-normal text-slate-400">({item.unit})</span>
            </label>
            <input
              type="number" min="0.01" step="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <button onClick={onClose} className="px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm text-white rounded-xl font-medium transition-colors disabled:opacity-60 ${
              mode === "add" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"
            }`}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : (mode === "add" ? "Add Stock" : "Deduct Stock")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function StockroomPage() {
  const [items, setItems]           = useState<StockItem[]>([]);
  const [stats, setStats]           = useState<{ total: number; totalLow: number; byCategory: CategoryStat[] } | null>(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState<Category | "All">("All");
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<StockItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
  const [adjustMode, setAdjustMode] = useState<"add" | "deduct">("add");
  const [toasts, setToasts]         = useState<Toast[]>([]);
  const [deleting, setDeleting]     = useState<string | null>(null);

  const toast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [itemsRes, statsRes] = await Promise.all([
      fetch("/api/admin/dept/stock").then((r) => r.json()),
      fetch("/api/admin/dept/stock?stats=1").then((r) => r.json()),
    ]);
    if (itemsRes.success) setItems(itemsRes.data);
    if (statsRes.success) setStats(statsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (item: StockItem) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setDeleting(item.id);
    try {
      const res  = await fetch(`/api/admin/dept/stock?id=${item.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast(`"${item.name}" deleted.`);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = items.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "All" || i.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-6 space-y-6">
      <ToastContainer toasts={toasts} remove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <StockModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        editing={editing}
        onSaved={(msg) => { toast(msg); load(); }}
      />
      <AdjustModal
        open={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        item={adjustItem}
        mode={adjustMode}
        onSaved={(msg) => { toast(msg); load(); }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Inventory Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cleaning, pantry, maintenance, fuel, medicine, vehicle & more
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Stock Item
        </button>
      </div>

      {/* All cards unified — category + module in one grid, no orphan row */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...CATEGORIES, ...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl animate-pulse h-[72px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const stat   = stats?.byCategory.find((s) => s.category === cat);
            const count  = stat?.count    ?? 0;
            const lowCnt = stat?.lowStock ?? 0;
            return (
              <button key={cat} onClick={() => setFilterCat(filterCat === cat ? "All" : cat)}
                className={`border rounded-2xl px-3 py-2 text-left transition-all hover:shadow-md h-[72px] flex flex-col justify-between ${CAT_COLORS[cat]} ${
                  filterCat === cat ? "ring-2 ring-indigo-500 ring-offset-1" : ""
                }`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{CAT_ICONS[cat]}</span>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-tight">{cat}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{count}</p>
                  {lowCnt > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5">
                      <AlertTriangle className="h-3 w-3" /> {lowCnt} low
                    </p>
                  )}
                </div>
              </button>
            );
          })}
          {([
            { name: "Vehicle Fuel & Maintenance", icon: "⛽", desc: "Fuel logs & maintenance requests", href: "/admin/admin/fuel-requests",   bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/40 dark:border-yellow-800" },
            { name: "Office Supplies",            icon: "🛒", desc: "Office consumables",               href: "/admin/admin/pantry",          bg: "bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-800" },
            { name: "Medicine",                   icon: "💊", desc: "First aid & medical supplies",     href: "/admin/admin/medicine",        bg: "bg-pink-50 border-pink-200 dark:bg-pink-950/40 dark:border-pink-800" },
            { name: "Vehicle & Fuel",             icon: "🚗", desc: "Vehicle maintenance & fuel",       href: "/admin/admin/car-maintenance", bg: "bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700" },
            { name: "Maintenance Supplies",       icon: "🔧", desc: "Tools & maintenance materials",    href: "/admin/admin/maintenance",     bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800" },
            { name: "Appliances & Furniture",     icon: "🛋️", desc: "Equipment & office fixtures",    href: "/admin/admin/equipment",      bg: "bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800" },
            { name: "Repair Logs",                icon: "🛠️", desc: "Track repairs & service logs",   href: "/admin/admin/repair-logs",    bg: "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800" },
          ] as const).map((mod) => (
            <a key={mod.name} href={mod.href}
              className={`${mod.bg} border rounded-2xl px-3 py-2 hover:shadow-md hover:scale-[1.02] transition-all duration-150 flex items-center gap-3 h-[72px]`}>
              <div className="text-2xl shrink-0">{mod.icon}</div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">{mod.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{mod.desc}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Summary bar */}
      {!loading && stats && (
        <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
          <span>
            <span className="font-semibold text-slate-900 dark:text-white">{stats.total}</span> total items
          </span>
          {stats.totalLow > 0 && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" /> {stats.totalLow} low stock alert{stats.totalLow !== 1 ? "s" : ""}
            </span>
          )}
          {filterCat !== "All" && (
            <button onClick={() => setFilterCat("All")} className="text-indigo-600 hover:underline dark:text-indigo-400 flex items-center gap-1">
              <X className="h-3 w-3" /> Clear filter
            </button>
          )}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value as Category | "All")}
            className="pl-8 pr-8 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-14 text-center">
          <Package className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {items.length === 0 ? "No stock items yet. Add your first item." : "No items match your search."}
          </p>
          {items.length === 0 && (
            <button onClick={() => { setEditing(null); setShowModal(true); }}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors mx-auto">
              <Plus className="h-4 w-4" /> Add First Item
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {["Item Name", "Category", "Quantity", "Min", "Status", "Location", "Last Updated", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filtered.map((item) => {
                const qty    = Number(item.quantity);
                const min    = Number(item.minThreshold);
                const status = getStatus(qty, min);
                return (
                  <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                    qty === 0 ? "bg-red-50/30 dark:bg-red-950/10" :
                    (min > 0 && qty <= min) ? "bg-amber-50/30 dark:bg-amber-950/10" : ""
                  }`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                      {item.supplier && <p className="text-xs text-slate-400">{item.supplier}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        {CAT_ICONS[item.category]} {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setAdjustItem(item); setAdjustMode("deduct"); }}
                          className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors"
                          title="Deduct stock"
                        >
                          <Minus className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                        </button>
                        <span className={`font-semibold min-w-[3ch] text-center ${
                          qty === 0 ? "text-red-600 dark:text-red-400" :
                          (min > 0 && qty <= min) ? "text-amber-600 dark:text-amber-400" :
                          "text-slate-900 dark:text-white"
                        }`}>{qty.toLocaleString()}</span>
                        <button
                          onClick={() => { setAdjustItem(item); setAdjustMode("add"); }}
                          className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 flex items-center justify-center transition-colors"
                          title="Add stock"
                        >
                          <Plus className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                        </button>
                        <span className="text-xs text-slate-400">{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {min > 0 ? `${min} ${item.unit}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{item.location ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(item.updatedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditing(item); setShowModal(true); }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={deleting === item.id}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === item.id
                            ? <Loader2 className="h-3.5 w-3.5 text-red-500 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5 text-red-400" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400">
            Showing {filtered.length} of {items.length} items
          </div>
        </div>
      )}
    </div>
  );
}
