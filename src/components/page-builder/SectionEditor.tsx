"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, GripVertical, Trash2 } from "lucide-react";
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SectionType = "HERO" | "FEATURES" | "TESTIMONIALS" | "CONTACT" | "CTA" | "TEXT" | "IMAGE";

type SectionContent =
  | { type: "HERO"; content: HeroContent }
  | { type: "FEATURES"; content: FeaturesContent }
  | { type: "TESTIMONIALS"; content: TestimonialsContent }
  | { type: "CONTACT"; content: ContactContent }
  | { type: "CTA"; content: CtaContent }
  | { type: "TEXT"; content: TextContent }
  | { type: "IMAGE"; content: ImageContent };

export type PageSection = SectionContent & {
  readonly id: string;
  readonly order: number;
  readonly isVisible?: boolean;
  readonly alignment?: "left" | "center" | "right";
};

interface SectionEditorProps {
  readonly section: PageSection;
  readonly onUpdate: (section: PageSection) => void;
  readonly onDelete: (id: string) => void;
  readonly dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

/* ------------------------------------------------------------------ */
/*  Helper                                                             */
/* ------------------------------------------------------------------ */

function getSectionLabel(type: SectionType): string {
  return SECTION_TYPE_LABELS[type];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SectionEditor({ section, onUpdate, onDelete, dragHandleProps }: SectionEditorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleContentChange(newContent: PageSection["content"]): void {
    onUpdate({ ...section, content: newContent } as PageSection);
  }

  function handleDelete(): void {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(section.id);
  }

  function renderForm() {
    switch (section.type) {
      case "HERO":
        return (
          <HeroForm
            content={section.content as HeroContent}
            onChange={(c) => handleContentChange(c)}
          />
        );
      case "FEATURES":
        return (
          <FeaturesForm
            content={section.content as FeaturesContent}
            onChange={(c) => handleContentChange(c)}
          />
        );
      case "TESTIMONIALS":
        return (
          <TestimonialsForm
            content={section.content as TestimonialsContent}
            onChange={(c) => handleContentChange(c)}
          />
        );
      case "CONTACT":
        return (
          <ContactForm
            content={section.content as ContactContent}
            onChange={(c) => handleContentChange(c)}
          />
        );
      case "CTA":
        return (
          <CtaForm
            content={section.content as CtaContent}
            onChange={(c) => handleContentChange(c)}
          />
        );
      case "TEXT":
        return (
          <TextForm
            content={section.content as TextContent}
            onChange={(c) => handleContentChange(c)}
          />
        );
      case "IMAGE":
        return (
          <ImageForm
            content={section.content as ImageContent}
            onChange={(c) => handleContentChange(c)}
          />
        );
      default:
        return <p className="text-sm text-gray-400">Unknown section type.</p>;
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-0.5 shrink-0"
          aria-label="Drag to reorder"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {getSectionLabel(section.type)}
          </span>
          <span className="text-xs text-gray-400 font-mono">#{section.order + 1}</span>
        </button>

        {/* Delete button */}
        {confirmDelete ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-red-600 font-medium">Confirm?</span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDelete(section.id)}
              className="h-7 px-2 text-xs"
            >
              Yes, delete
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(false)}
              className="h-7 px-2 text-xs"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
            aria-label={`Delete ${getSectionLabel(section.type)} section`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-4">
          {renderForm()}
        </div>
      )}
    </div>
  );
}
