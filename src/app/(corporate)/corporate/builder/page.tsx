"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, FileText, Loader2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageCard } from "@/components/page-builder/PageCard";
import type { PageCardData } from "@/components/page-builder/PageCard";
import { UpgradeBanner } from "@/components/corporate/UpgradeBanner";
import { getPlanLabel } from "@/lib/constants/plan-limits";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PageType = "LANDING" | "CONTACT" | "CUSTOM";

interface NewPageForm {
  readonly title: string;
  readonly slug: string;
  readonly pageType: PageType;
}

interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
  readonly plan?: string;
  readonly pageLimit?: number | null;
  readonly pageCount?: number;
}

const DEFAULT_FORM: NewPageForm = { title: "", slug: "", pageType: "CUSTOM" };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

/* ------------------------------------------------------------------ */
/*  New page dialog                                                    */
/* ------------------------------------------------------------------ */

interface NewPageDialogProps {
  readonly onClose: () => void;
  readonly onCreated: (page: PageCardData) => void;
}

function NewPageDialog({ onClose, onCreated }: NewPageDialogProps) {
  const [form, setForm] = useState<NewPageForm>(DEFAULT_FORM);
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTitle(value: string): void {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugEdited ? prev.slug : titleToSlug(value),
    }));
  }

  function updateSlug(value: string): void {
    setSlugEdited(true);
    setForm((prev) => ({ ...prev, slug: value.toLowerCase().replace(/[^a-z0-9-]/g, "") }));
  }

  function updatePageType(value: PageType): void {
    setForm((prev) => ({ ...prev, pageType: value }));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/corporate/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          slug: form.slug.trim(),
          type: form.pageType,
          isPublished: false,
        }),
      });

      const json = (await res.json()) as ApiResponse<PageCardData>;

      if (!json.success || !json.data) {
        setError(json.error ?? "Failed to create page.");
        return;
      }

      onCreated(json.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Create new page"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Page</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-page-title" className="text-sm font-medium text-gray-700">
              Title
            </Label>
            <Input
              id="new-page-title"
              value={form.title}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="My Landing Page"
              maxLength={200}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-page-slug" className="text-sm font-medium text-gray-700">
              Slug
            </Label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-400">/</span>
              <Input
                id="new-page-slug"
                value={form.slug}
                onChange={(e) => updateSlug(e.target.value)}
                placeholder="my-landing-page"
                maxLength={100}
                className="font-mono text-sm"
              />
            </div>
            <p className="text-xs text-gray-400">Only lowercase letters, numbers, and hyphens.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-page-type" className="text-sm font-medium text-gray-700">
              Page Type
            </Label>
            <select
              id="new-page-type"
              value={form.pageType}
              onChange={(e) => updatePageType(e.target.value as PageType)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="CUSTOM">Custom</option>
              <option value="LANDING">Landing Page</option>
              <option value="CONTACT">Contact Page</option>
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !form.title.trim() || !form.slug.trim()} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Creating…" : "Create Page"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function BuilderListPage() {
  const [pages, setPages] = useState<readonly PageCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [plan, setPlan] = useState<string>("TRIAL");
  const [pageLimit, setPageLimit] = useState<number | null>(3);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/corporate/pages");
      const json = (await res.json()) as ApiResponse<PageCardData[]>;
      if (!json.success || !json.data) {
        setError(json.error ?? "Failed to load pages.");
        return;
      }
      setPages(json.data);
      if (json.plan) setPlan(json.plan);
      if (json.pageLimit !== undefined) setPageLimit(json.pageLimit ?? null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  const atLimit = pageLimit !== null && pages.length >= pageLimit;

  useEffect(() => {
    if (atLimit) {
      setShowUpgradeBanner(true);
    }
  }, [atLimit]);

  function handleCreated(page: PageCardData): void {
    setPages((prev) => [...prev, page]);
    setShowNewDialog(false);
  }

  function handleDelete(id: string): void {
    // Optimistic remove
    setPages((prev) => prev.filter((p) => p.id !== id));

    fetch(`/api/corporate/pages/${id}`, { method: "DELETE" }).catch(() => {
      // Re-fetch on error to restore state
      void fetchPages();
    });
  }

  function handleNewPageClick(): void {
    if (atLimit) {
      setShowUpgradeBanner(true);
      return;
    }
    setShowNewDialog(true);
  }

  const pageLimitLabel =
    pageLimit === null
      ? "Unlimited pages"
      : `${pages.length} of ${pageLimit} pages used`;

  return (
    <div className="space-y-6">
      {/* Upgrade banner */}
      {showUpgradeBanner && atLimit && pageLimit !== null && (
        <UpgradeBanner
          plan={plan}
          limit={pageLimit}
          onDismiss={() => setShowUpgradeBanner(false)}
        />
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Page Builder</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Create and manage your white-label pages
          </p>
          {!loading && (
            <p className="text-xs text-gray-400 mt-1">
              <span className={atLimit ? "text-amber-600 font-medium" : ""}>
                {pageLimitLabel}
              </span>
              {pageLimit !== null && (
                <span className="ml-1 text-gray-400">
                  &middot; {getPlanLabel(plan)} plan
                </span>
              )}
            </p>
          )}
        </div>
        <Button
          type="button"
          onClick={handleNewPageClick}
          className="gap-2"
          disabled={atLimit}
          title={atLimit ? `Page limit reached (${pageLimit} max on ${getPlanLabel(plan)} plan)` : undefined}
        >
          <Plus className="h-4 w-4" />
          New Page
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchPages}
            className="ml-auto h-7 text-xs"
          >
            Retry
          </Button>
        </div>
      ) : pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-gray-200">
          <FileText className="h-10 w-10 text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-gray-600 mb-1">No pages yet</h3>
          <p className="text-sm text-gray-400 mb-5">Create your first page to get started.</p>
          <Button type="button" onClick={() => setShowNewDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create your first page
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <PageCard key={page.id} page={page} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showNewDialog && (
        <NewPageDialog
          onClose={() => setShowNewDialog(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
