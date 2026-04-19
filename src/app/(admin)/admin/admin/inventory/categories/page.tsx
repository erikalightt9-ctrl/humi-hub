"use client";

import Link from "next/link";
import { useEffect, useState, FormEvent } from "react";
import { ArrowLeft, Plus, Loader2, Edit2, Trash2, FolderTree, X } from "lucide-react";

type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  _count: { items: number };
};

const EMPTY = { name: "", description: "", icon: "📋" };

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState<{ mode: "create" | "edit"; row: Category | null } | null>(null);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [banner, setBanner]   = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/inventory/categories");
    const json = await res.json();
    if (json.success) setItems(json.data);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const openCreate = () => {
    setForm(EMPTY);
    setModal({ mode: "create", row: null });
  };

  const openEdit = (row: Category) => {
    setForm({ name: row.name, description: row.description ?? "", icon: row.icon ?? "📋" });
    setModal({ mode: "edit", row });
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    setBanner(null);

    try {
      const isEdit = modal.mode === "edit";
      const url = isEdit ? `/api/admin/inventory/categories?id=${modal.row!.id}` : "/api/admin/inventory/categories";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Save failed");
      setBanner({ kind: "success", text: isEdit ? "Category updated" : "Category created" });
      setModal(null);
      await load();
    } catch (err) {
      setBanner({ kind: "error", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: Category) => {
    if (!confirm(`Delete category "${row.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/inventory/categories?id=${row.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) {
      setBanner({ kind: "error", text: json.error || "Delete failed" });
      return;
    }
    setBanner({ kind: "success", text: "Category deleted" });
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin/admin/inventory"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Inventory
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-indigo-600" />
            Categories
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create, rename, and manage inventory categories
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Category
        </button>
      </div>

      {banner && (
        <div className={`px-3 py-2 text-sm rounded-lg border ${
          banner.kind === "success"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
        }`}>
          {banner.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
          <p className="text-sm text-slate-500 mb-3">No categories yet.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4" /> Create your first category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/admin/admin/inventory/categories/${c.id}`} className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80">
                  <span className="text-xl">{c.icon ?? "📋"}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{c.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {c._count.items} item{c._count.items === 1 ? "" : "s"}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(c)} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {c.description && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{c.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={closeModal}>
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {modal.mode === "edit" ? "Edit Category" : "New Category"}
              </h2>
              <button type="button" onClick={closeModal} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Icon</label>
                <input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  maxLength={4}
                  className="w-20 px-3 py-2 text-center text-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Paste any emoji</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Cleaning Supplies"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-700">
              <button type="button" onClick={closeModal} disabled={saving} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-medium">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : modal.mode === "edit" ? "Save Changes" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
