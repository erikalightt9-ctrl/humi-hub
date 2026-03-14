"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";
import { KB_CATEGORIES } from "@/lib/constants/communications";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Article {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly content: string;
  readonly category: string;
  readonly isPublished: boolean;
  readonly order: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

type View = "list" | "create" | "edit";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function KnowledgeBaseManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("GETTING_STARTED");
  const [isPublished, setIsPublished] = useState(false);
  const [order, setOrder] = useState(0);

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/knowledge-base");
      const data = await res.json();
      if (data.success) setArticles(data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  function resetForm() {
    setTitle("");
    setContent("");
    setCategory("GETTING_STARTED");
    setIsPublished(false);
    setOrder(0);
    setEditArticle(null);
  }

  function startEdit(article: Article) {
    setEditArticle(article);
    setTitle(article.title);
    setContent(article.content);
    setCategory(article.category);
    setIsPublished(article.isPublished);
    setOrder(article.order);
    setView("edit");
  }

  function startCreate() {
    resetForm();
    setView("create");
  }

  function goBack() {
    resetForm();
    setView("list");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const payload = { title, content, category, isPublished, order };
      const isEdit = view === "edit" && editArticle;
      const url = isEdit
        ? `/api/admin/knowledge-base/${editArticle.id}`
        : "/api/admin/knowledge-base";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        fetchArticles();
        goBack();
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/knowledge-base/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchArticles();
    } catch { /* ignore */ }
    setDeleting(null);
  }

  function categoryLabel(value: string): string {
    return KB_CATEGORIES.find((c) => c.value === value)?.label ?? value;
  }

  /* ---------------------------------------------------------------- */
  /*  Create / Edit Form                                               */
  /* ---------------------------------------------------------------- */

  if (view === "create" || view === "edit") {
    return (
      <div className="space-y-6">
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to articles
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {view === "edit" ? "Edit Article" : "New Article"}
          </h1>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {KB_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Published
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Article content (supports markdown)"
              rows={16}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {view === "edit" ? "Update Article" : "Create Article"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Article List                                                     */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-500 text-sm mt-1">Manage help center articles</p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New Article
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading articles...</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No articles yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">
                      {article.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {categoryLabel(article.category)}
                    </td>
                    <td className="px-4 py-3">
                      {article.isPublished ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <Eye className="h-3 w-3" /> Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <EyeOff className="h-3 w-3" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{article.order}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(article.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(article)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          disabled={deleting === article.id}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === article.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
