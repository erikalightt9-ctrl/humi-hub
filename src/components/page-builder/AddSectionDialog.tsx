"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_SECTION_CONTENT, SECTION_TYPE_LABELS, MAX_SECTIONS_PER_PAGE } from "@/lib/constants/page-builder";
import type { SectionType, PageSection } from "./SectionEditor";

export type NewSection = Omit<PageSection, "order">;

interface AddSectionDialogProps {
  readonly onAdd: (section: NewSection) => void;
  readonly onClose: () => void;
  readonly currentCount: number;
}

const SECTION_DESCRIPTIONS: Record<SectionType, string> = {
  HERO: "Full-width banner with headline, subheadline, and a call-to-action button.",
  FEATURES: "Grid of features or benefits with icon, title, and description.",
  TESTIMONIALS: "Student reviews and quotes with name and role.",
  CONTACT: "Contact title, description, and optional inquiry form.",
  CTA: "Prominent call-to-action block with headline and button.",
  TEXT: "Free-form text block with optional title and rich body content.",
  IMAGE: "Single image with alt text and optional caption.",
};

const SECTION_ICONS: Record<SectionType, string> = {
  HERO: "🖼️",
  FEATURES: "✨",
  TESTIMONIALS: "💬",
  CONTACT: "📬",
  CTA: "🚀",
  TEXT: "📝",
  IMAGE: "🖼",
};

const SECTION_TYPES: SectionType[] = ["HERO", "FEATURES", "TESTIMONIALS", "CONTACT", "CTA", "TEXT", "IMAGE"];

export function AddSectionDialog({ onAdd, onClose, currentCount }: AddSectionDialogProps) {
  const isAtLimit = currentCount >= MAX_SECTIONS_PER_PAGE;

  function handleAdd(type: SectionType): void {
    if (isAtLimit) return;
    const content = DEFAULT_SECTION_CONTENT[type];
    const section: NewSection = {
      id: crypto.randomUUID(),
      type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: content as any,
    };
    onAdd(section);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Add a section"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Section</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {isAtLimit
                ? `Maximum of ${MAX_SECTIONS_PER_PAGE} sections reached`
                : `${currentCount} of ${MAX_SECTIONS_PER_PAGE} sections used`}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0" aria-label="Close dialog">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {isAtLimit && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 mb-3">
              You have reached the maximum number of sections per page.
            </div>
          )}
          {SECTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleAdd(type)}
              disabled={isAtLimit}
              className="w-full flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200"
            >
              <span className="text-2xl shrink-0 mt-0.5" aria-hidden="true">{SECTION_ICONS[type]}</span>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm">{SECTION_TYPE_LABELS[type]}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{SECTION_DESCRIPTIONS[type]}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
