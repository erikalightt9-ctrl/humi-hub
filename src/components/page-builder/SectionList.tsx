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
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionEditor } from "./SectionEditor";
import { AddSectionDialog } from "./AddSectionDialog";
import type { PageSection } from "./SectionEditor";
import type { NewSection } from "./AddSectionDialog";

interface SectionListProps {
  readonly sections: readonly PageSection[];
  readonly onUpdate: (section: PageSection) => void;
  readonly onDelete: (id: string) => void;
  readonly onReorder: (sections: readonly PageSection[]) => void;
  readonly onAdd: (section: PageSection) => void;
}

interface SortableSectionProps {
  readonly section: PageSection;
  readonly onUpdate: (section: PageSection) => void;
  readonly onDelete: (id: string) => void;
}

function SortableSection({ section, onUpdate, onDelete }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <SectionEditor
        section={section}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function SectionList({ sections, onUpdate, onDelete, onReorder, onAdd }: SectionListProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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
    const section: PageSection = { ...newSection, order: sections.length } as PageSection;
    onAdd(section);
  }

  return (
    <div className="space-y-3">
      {sections.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-400 mb-3">No sections yet.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add your first section
          </Button>
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((section) => (
            <SortableSection key={section.id} section={section} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </SortableContext>
      </DndContext>
      {sections.length > 0 && (
        <Button type="button" variant="outline" onClick={() => setShowAddDialog(true)} className="w-full gap-2 border-dashed">
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      )}
      {showAddDialog && (
        <AddSectionDialog onAdd={handleAdd} onClose={() => setShowAddDialog(false)} currentCount={sections.length} />
      )}
    </div>
  );
}
