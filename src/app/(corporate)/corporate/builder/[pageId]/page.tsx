"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionListPanel } from "@/components/page-builder/SectionListPanel";
import { LivePreviewPanel } from "@/components/page-builder/LivePreviewPanel";
import { SettingsPanel } from "@/components/page-builder/SettingsPanel";
import type { PageSection } from "@/components/page-builder/SectionEditor";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PageType = "LANDING" | "CONTACT" | "CUSTOM";

interface PageData {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly type: PageType;
  readonly isPublished: boolean;
  readonly metaTitle: string | null;
  readonly metaDescription: string | null;
  readonly sections: readonly PageSection[];
  readonly updatedAt: string;
}

interface EditablePageState {
  title: string;
  slug: string;
  type: PageType;
  isPublished: boolean;
  metaTitle: string;
  metaDescription: string;
  sections: readonly PageSection[];
}

interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function pageToEditState(page: PageData): EditablePageState {
  return {
    title: page.title,
    slug: page.slug,
    type: page.type,
    isPublished: page.isPublished,
    metaTitle: page.metaTitle ?? "",
    metaDescription: page.metaDescription ?? "",
    sections: page.sections ?? [],
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PageEditorPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = use(params);

  const [page, setPage] = useState<PageData | null>(null);
  const [form, setForm] = useState<EditablePageState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showSeoFields, setShowSeoFields] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Responsive: track if we should show tabs instead of 3 panels
  const [activeTab, setActiveTab] = useState<"list" | "preview" | "settings">("list");

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/corporate/pages/${pageId}`);
      const json = (await res.json()) as ApiResponse<PageData>;
      if (!json.success || !json.data) {
        setLoadError(json.error ?? "Page not found.");
        return;
      }
      setPage(json.data);
      setForm(pageToEditState(json.data));
      setIsDirty(false);
    } catch {
      setLoadError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  function updateForm<K extends keyof EditablePageState>(key: K, value: EditablePageState[K]): void {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
    setIsDirty(true);
    setSaveSuccess(false);
    setSaveError(null);
  }

  function handleSectionUpdate(updated: PageSection): void {
    setForm((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s) => (s.id === updated.id ? updated : s));
      return { ...prev, sections };
    });
    setIsDirty(true);
    setSaveSuccess(false);
  }

  function handleSectionDelete(id: string): void {
    setForm((prev) => {
      if (!prev) return prev;
      const sections = prev.sections
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, order: i }));
      return { ...prev, sections };
    });
    // Clear selection if deleted section was selected
    setSelectedSectionId((prev) => (prev === id ? null : prev));
    setIsDirty(true);
    setSaveSuccess(false);
  }

  function handleSectionReorder(sections: readonly PageSection[]): void {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, sections };
    });
    setIsDirty(true);
    setSaveSuccess(false);
  }

  function handleSectionAdd(section: PageSection): void {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, sections: [...prev.sections, section] };
    });
    setSelectedSectionId(section.id);
    setIsDirty(true);
    setSaveSuccess(false);
  }

  function handleToggleVisibility(id: string): void {
    setForm((prev) => {
      if (!prev) return prev;
      const sections = prev.sections.map((s) =>
        s.id === id ? { ...s, isVisible: s.isVisible === false ? true : false } : s
      );
      return { ...prev, sections };
    });
    setIsDirty(true);
    setSaveSuccess(false);
  }

  async function handleSave(): Promise<void> {
    if (!form) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        type: form.type,
        isPublished: form.isPublished,
        metaTitle: form.metaTitle.trim() || null,
        metaDescription: form.metaDescription.trim() || null,
        sections: form.sections,
      };

      const res = await fetch(`/api/corporate/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as ApiResponse<PageData>;

      if (!json.success || !json.data) {
        setSaveError(json.error ?? "Failed to save page.");
        return;
      }

      setPage(json.data);
      setIsDirty(false);
      setSaveSuccess(true);

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ── Loading / error states ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <div className="space-y-4 p-4">
        <Link href="/corporate/builder">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Pages
          </Button>
        </Link>
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {loadError ?? "Page not found."}
        </div>
      </div>
    );
  }

  const selectedSection = form.sections.find((s) => s.id === selectedSectionId) ?? null;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* ── Top bar ── */}
      <div className="shrink-0 border-b border-gray-200 px-4 py-2 flex items-center gap-3 bg-white">
        {/* Back link */}
        <Link href="/corporate/builder">
          <Button variant="ghost" size="sm" className="gap-1.5 px-2 h-8 text-xs shrink-0">
            <ArrowLeft className="h-3.5 w-3.5" />
            Pages
          </Button>
        </Link>

        {/* Title input */}
        <div className="flex-1 min-w-0">
          <Input
            value={form.title}
            onChange={(e) => updateForm("title", e.target.value)}
            placeholder="Page title"
            maxLength={200}
            className="h-8 text-sm font-medium"
          />
        </div>

        {/* Slug display */}
        <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400 shrink-0 font-mono">
          <span>/</span>
          <span className="max-w-[120px] truncate">{form.slug || "—"}</span>
        </span>

        {/* Publish toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={form.isPublished}
          onClick={() => updateForm("isPublished", !form.isPublished)}
          className={`hidden sm:flex relative h-5 w-9 items-center rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            form.isPublished ? "bg-blue-600" : "bg-gray-200"
          }`}
          title={form.isPublished ? "Published" : "Draft"}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              form.isPublished ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
        <span className="hidden sm:block text-xs text-gray-500 shrink-0">
          {form.isPublished ? "Published" : "Draft"}
        </span>

        {/* SEO toggle */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowSeoFields((v) => !v)}
          className="gap-1.5 h-8 text-xs px-2 shrink-0"
        >
          {showSeoFields ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          SEO
        </Button>

        {/* Unsaved changes badge */}
        {isDirty && (
          <span className="hidden sm:inline text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
            Unsaved
          </span>
        )}

        {/* Save button */}
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="gap-1.5 h-8 text-xs shrink-0"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saving ? "Saving…" : "Save"}
        </Button>

        {/* Status icons */}
        {saveSuccess && (
          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
        )}
        {saveError && (
          <span title={saveError ?? undefined}><AlertCircle className="h-4 w-4 text-red-500 shrink-0" /></span>
        )}
      </div>

      {/* ── SEO fields (collapsible) ── */}
      {showSeoFields && (
        <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="meta-title" className="text-xs font-medium text-gray-600">
              Meta Title
            </Label>
            <Input
              id="meta-title"
              value={form.metaTitle}
              onChange={(e) => updateForm("metaTitle", e.target.value)}
              placeholder="Page title for search engines"
              maxLength={200}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="meta-description" className="text-xs font-medium text-gray-600">
              Meta Description
            </Label>
            <Input
              id="meta-description"
              value={form.metaDescription}
              onChange={(e) => updateForm("metaDescription", e.target.value)}
              placeholder="Short description for search results"
              maxLength={400}
              className="h-8 text-xs"
            />
          </div>
        </div>
      )}

      {/* ── Mobile tab bar (< xl) ── */}
      <div className="xl:hidden shrink-0 border-b border-gray-200 bg-white flex">
        {(["list", "preview", "settings"] as const).map((tab) => {
          const labels = { list: "Sections", preview: "Preview", settings: "Settings" };
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ── 3-panel grid (xl+) / tab view (< xl) ── */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop: 3-panel grid */}
        <div className="hidden xl:flex h-full">
          <div className="w-[280px] shrink-0 overflow-hidden">
            <SectionListPanel
              sections={form.sections}
              selectedId={selectedSectionId}
              onSelect={setSelectedSectionId}
              onAdd={handleSectionAdd}
              onDelete={handleSectionDelete}
              onReorder={handleSectionReorder}
              onToggleVisibility={handleToggleVisibility}
              disabled={saving}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <LivePreviewPanel sections={form.sections} />
          </div>
          <div className="w-[340px] shrink-0 overflow-hidden">
            <SettingsPanel
              section={selectedSection}
              onUpdate={handleSectionUpdate}
              onDelete={handleSectionDelete}
            />
          </div>
        </div>

        {/* Mobile: tab-based view */}
        <div className="xl:hidden h-full overflow-hidden">
          {activeTab === "list" && (
            <SectionListPanel
              sections={form.sections}
              selectedId={selectedSectionId}
              onSelect={(id) => {
                setSelectedSectionId(id);
                setActiveTab("settings");
              }}
              onAdd={(section) => {
                handleSectionAdd(section);
                setActiveTab("settings");
              }}
              onDelete={handleSectionDelete}
              onReorder={handleSectionReorder}
              onToggleVisibility={handleToggleVisibility}
              disabled={saving}
            />
          )}
          {activeTab === "preview" && (
            <LivePreviewPanel sections={form.sections} />
          )}
          {activeTab === "settings" && (
            <SettingsPanel
              section={selectedSection}
              onUpdate={handleSectionUpdate}
              onDelete={handleSectionDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
