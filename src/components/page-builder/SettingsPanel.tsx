"use client";

import { useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SECTION_TYPE_LABELS } from "@/lib/constants/page-builder";
import { HeroForm } from "./section-forms/HeroForm";
import { FeaturesForm } from "./section-forms/FeaturesForm";
import { TestimonialsForm } from "./section-forms/TestimonialsForm";
import { ContactForm } from "./section-forms/ContactForm";
import { CtaForm } from "./section-forms/CtaForm";
import { TextForm } from "./section-forms/TextForm";
import { ImageForm } from "./section-forms/ImageForm";
import type { HeroContent } from "./section-forms/HeroForm";
import type { FeaturesContent } from "./section-forms/FeaturesForm";
import type { TestimonialsContent } from "./section-forms/TestimonialsForm";
import type { ContactContent } from "./section-forms/ContactForm";
import type { CtaContent } from "./section-forms/CtaForm";
import type { TextContent } from "./section-forms/TextForm";
import type { ImageContent } from "./section-forms/ImageForm";
import type { PageSection } from "./SectionEditor";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SettingsPanelProps {
  readonly section: PageSection | null;
  readonly onUpdate: (section: PageSection) => void;
  readonly onDelete: (id: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SettingsPanel({ section, onUpdate, onDelete }: SettingsPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!section) {
    return (
      <div className="flex items-center justify-center h-full bg-white border-l border-gray-200 p-6">
        <p className="text-sm text-gray-400 text-center">
          Select a section from the left panel to edit it
        </p>
      </div>
    );
  }

  const label = SECTION_TYPE_LABELS[section.type as keyof typeof SECTION_TYPE_LABELS] ?? section.type;
  const alignment = section.alignment ?? "center";
  const isVisible = section.isVisible !== false;

  function handleContentChange(newContent: PageSection["content"]): void {
    onUpdate({ ...section!, content: newContent } as PageSection);
  }

  function handleAlignmentChange(value: "left" | "center" | "right"): void {
    onUpdate({ ...section!, alignment: value });
  }

  function handleVisibilityChange(checked: boolean): void {
    onUpdate({ ...section!, isVisible: checked });
  }

  function handleDelete(): void {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(section!.id);
    setConfirmDelete(false);
  }

  function renderForm() {
    switch (section!.type) {
      case "HERO":
        return (
          <HeroForm
            content={section!.content as HeroContent}
            onChange={handleContentChange}
          />
        );
      case "FEATURES":
        return (
          <FeaturesForm
            content={section!.content as FeaturesContent}
            onChange={handleContentChange}
          />
        );
      case "TESTIMONIALS":
        return (
          <TestimonialsForm
            content={section!.content as TestimonialsContent}
            onChange={handleContentChange}
          />
        );
      case "CONTACT":
        return (
          <ContactForm
            content={section!.content as ContactContent}
            onChange={handleContentChange}
          />
        );
      case "CTA":
        return (
          <CtaForm
            content={section!.content as CtaContent}
            onChange={handleContentChange}
          />
        );
      case "TEXT":
        return (
          <TextForm
            content={section!.content as TextContent}
            onChange={handleContentChange}
          />
        );
      case "IMAGE":
        return (
          <ImageForm
            content={section!.content as ImageContent}
            onChange={handleContentChange}
          />
        );
      default:
        return <p className="text-sm text-gray-400">Unknown section type.</p>;
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 overflow-y-auto">
      {/* Header: section type label */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Alignment control */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Alignment</p>
          <div className="flex gap-1">
            {(["left", "center", "right"] as const).map((align) => {
              const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
              return (
                <button
                  key={align}
                  type="button"
                  onClick={() => handleAlignmentChange(align)}
                  className={`flex-1 flex items-center justify-center h-8 rounded border text-xs transition-colors ${
                    alignment === align
                      ? "border-blue-400 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  aria-label={`Align ${align}`}
                  title={`Align ${align}`}
                  aria-pressed={alignment === align}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Visibility toggle */}
        <div className="flex items-center justify-between">
          <label htmlFor={`visibility-${section.id}`} className="text-xs font-medium text-gray-600 cursor-pointer">
            Show section
          </label>
          <input
            id={`visibility-${section.id}`}
            type="checkbox"
            checked={isVisible}
            onChange={(e) => handleVisibilityChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </div>

        {/* Divider */}
        <hr className="border-gray-100" />

        {/* Section form */}
        <div>
          {renderForm()}
        </div>
      </div>

      {/* Delete section */}
      <div className="shrink-0 p-4 border-t border-gray-100">
        {confirmDelete ? (
          <div className="space-y-2">
            <p className="text-xs text-red-600 font-medium text-center">Delete this section?</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="flex-1 text-xs h-8"
              >
                Yes, delete
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 text-xs h-8"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="w-full gap-1.5 text-xs h-8 text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Section
          </Button>
        )}
      </div>
    </div>
  );
}
