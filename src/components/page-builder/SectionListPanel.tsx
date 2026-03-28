"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddSectionDialog } from "./AddSectionDialog";
import { SECTION_TYPE_LABELS } from "@/lib/constants/page-builder";
import type { PageSection } from "./SectionEditor";
import type { NewSection } from "./AddSectionDialog";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SectionListPanelProps {
  readonly sections: readonly PageSection[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  readonly onAdd: (section: PageSection) => void;
  readonly onDelete: (id: string) => void;
  readonly onReorder: (sections: readonly PageSection[]) => void;
  readonly onToggleVisibility: (id: string) => void;
  readonly disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Sortable item                                                      */
/* ------------------------------------------------------------------ */

interface SortableItemProps {
  readonly section: PageSection;
  readonly isSelected: boolean;
  readonly onSelect: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onToggleVisibility: (id: string) => void;
  readonly disabled?: boolean;
}

function SortableItem({
  section,
  isSelected,
  onSelect,
  onDelete,
  onToggleVisibility,
  disabled,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const isHidden = section.isVisible === false;
  const label = SECTION_TYPE_LABELS[section.type as keyof typeof SECTION_TYPE_LABELS] ?? section.type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 h-11 px-2 rounded-lg border cursor-pointer transition-colors select-none ${
        isSelected
          ? "border-blue-400 bg-blue-50 text-blue-800"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700"
      }`}
      onClick={() => onSelect(section.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(section.id);
        }
      }}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-0.5 shrink-0"
        aria-label="Drag to reorder"
        disabled={disabled}
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Label */}
      <span className={`flex-1 min-w-0 text-xs font-medium truncate ${isHidden ? "opacity-50" : ""}`}>
        {label}
      </span>

      {/* Visibility toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility(section.id);
        }}
        disabled={disabled}
        className="shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
        aria-label={isHidden ? "Show section" : "Hide section"}
        title={isHidden ? "Show section" : "Hide section"}
      >
        {isHidden ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(section.id);
        }}
        disabled={disabled}
        className="shrink-0 p-1 rounded text-red-300 hover:text-red-500 transition-colors"
        aria-label={`Delete ${label} section`}
        title="Delete section"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SectionListPanel                                                   */
/* ------------------------------------------------------------------ */

export function SectionListPanel({
  sections,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onReorder,
  onToggleVisibility,
  disabled,
}: SectionListPanelProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...sections];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const withUpdatedOrder = reordered.map((s, i) => ({ ...s, order: i }));
    onReorder(withUpdatedOrder);
  }

  function handleAdd(newSection: NewSection): void {
    const section: PageSection = {
      ...newSection,
      order: sections.length,
      isVisible: true,
      alignment: "center",
    } as PageSection;
    onAdd(section);
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Sections ({sections.length})
        </p>
      </div>

      {/* Section list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sections.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-xs text-gray-400">No sections yet.</p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section) => (
              <SortableItem
                key={section.id}
                section={section}
                isSelected={section.id === selectedId}
                onSelect={onSelect}
                onDelete={onDelete}
                onToggleVisibility={onToggleVisibility}
                disabled={disabled}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add Section button */}
      <div className="p-2 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddDialog(true)}
          disabled={disabled}
          className="w-full gap-1.5 text-xs h-8 border-dashed"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Section
        </Button>
      </div>

      {showAddDialog && (
        <AddSectionDialog
          onAdd={handleAdd}
          onClose={() => setShowAddDialog(false)}
          currentCount={sections.length}
        />
      )}
    </div>
  );
}
