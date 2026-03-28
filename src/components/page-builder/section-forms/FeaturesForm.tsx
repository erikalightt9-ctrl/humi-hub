"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export interface FeatureItem {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

export interface FeaturesContent {
  readonly title: string;
  readonly items: readonly FeatureItem[];
}

interface FeaturesFormProps {
  readonly content: FeaturesContent;
  readonly onChange: (content: FeaturesContent) => void;
}

const MAX_ITEMS = 10;
const DEFAULT_ITEM: FeatureItem = { icon: "✓", title: "", description: "" };

export function FeaturesForm({ content, onChange }: FeaturesFormProps) {
  function updateTitle(value: string): void {
    onChange({ ...content, title: value });
  }

  function updateItem(index: number, field: keyof FeatureItem, value: string): void {
    const updated = content.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange({ ...content, items: updated });
  }

  function addItem(): void {
    if (content.items.length >= MAX_ITEMS) return;
    onChange({ ...content, items: [...content.items, DEFAULT_ITEM] });
  }

  function removeItem(index: number): void {
    const updated = content.items.filter((_, i) => i !== index);
    onChange({ ...content, items: updated });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="features-title" className="text-sm font-medium text-gray-700">
          Section Title
        </Label>
        <Input
          id="features-title"
          value={content.title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="Why Choose Us"
          maxLength={200}
        />
      </div>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Items ({content.items.length}/{MAX_ITEMS})
        </p>
        {content.items.map((item, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-3 space-y-2 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Item {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                aria-label={`Remove item ${index + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-500">Icon</Label>
                <Input
                  value={item.icon}
                  onChange={(e) => updateItem(index, "icon", e.target.value)}
                  placeholder="✓"
                  maxLength={10}
                  className="text-center"
                />
              </div>
              <div className="col-span-3 flex flex-col gap-1">
                <Label className="text-xs text-gray-500">Title</Label>
                <Input
                  value={item.title}
                  onChange={(e) => updateItem(index, "title", e.target.value)}
                  placeholder="Feature title"
                  maxLength={100}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500">Description</Label>
              <Input
                value={item.description}
                onChange={(e) => updateItem(index, "description", e.target.value)}
                placeholder="Brief description"
                maxLength={300}
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={content.items.length >= MAX_ITEMS}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>
    </div>
  );
}
