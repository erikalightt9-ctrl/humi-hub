"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Globe, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PageCardData {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly type: "LANDING" | "CONTACT" | "CUSTOM";
  readonly isPublished: boolean;
  readonly updatedAt: string;
}

interface PageCardProps {
  readonly page: PageCardData;
  readonly onDelete: (id: string) => void;
}

const PAGE_TYPE_LABELS: Record<PageCardData["type"], string> = {
  LANDING: "Landing",
  CONTACT: "Contact",
  CUSTOM: "Custom",
};

const PAGE_TYPE_COLORS: Record<PageCardData["type"], string> = {
  LANDING: "bg-blue-100 text-blue-700",
  CONTACT: "bg-purple-100 text-purple-700",
  CUSTOM: "bg-gray-100 text-gray-700",
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function PageCard({ page, onDelete }: PageCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDeleteClick(): void {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(page.id);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-gray-900 text-base truncate">{page.title}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PAGE_TYPE_COLORS[page.type]}`}>
              {PAGE_TYPE_LABELS[page.type]}
            </span>
            {page.isPublished ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <Globe className="h-3 w-3" />
                Published
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                <FileText className="h-3 w-3" />
                Draft
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 font-mono truncate">/{page.slug}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            Updated {formatDate(page.updatedAt)}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {confirmDelete ? (
            <>
              <span className="text-xs text-red-600 font-medium">Delete?</span>
              <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(page.id)} className="h-8 px-3 text-xs">
                Yes
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} className="h-8 px-3 text-xs">
                No
              </Button>
            </>
          ) : (
            <>
              <Link href={`/corporate/builder/${page.id}`}>
                <Button type="button" variant="outline" size="sm" className="gap-1.5 h-8" aria-label={`Edit ${page.title}`}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                aria-label={`Delete ${page.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
