"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export interface TestimonialItem {
  readonly name: string;
  readonly role: string;
  readonly quote: string;
  readonly avatar: string;
}

export interface TestimonialsContent {
  readonly title: string;
  readonly items: readonly TestimonialItem[];
}

interface TestimonialsFormProps {
  readonly content: TestimonialsContent;
  readonly onChange: (content: TestimonialsContent) => void;
}

const MAX_ITEMS = 10;
const DEFAULT_ITEM: TestimonialItem = { name: "", role: "", quote: "", avatar: "" };

export function TestimonialsForm({ content, onChange }: TestimonialsFormProps) {
  function updateTitle(value: string): void {
    onChange({ ...content, title: value });
  }

  function updateItem(index: number, field: keyof TestimonialItem, value: string): void {
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
        <Label htmlFor="testimonials-title" className="text-sm font-medium text-gray-700">
          Section Title
        </Label>
        <Input
          id="testimonials-title"
          value={content.title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="What Our Students Say"
          maxLength={200}
        />
      </div>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Testimonials ({content.items.length}/{MAX_ITEMS})
        </p>
        {content.items.map((item, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-3 space-y-2 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Testimonial {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                aria-label={`Remove testimonial ${index + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-500">Name</Label>
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(index, "name", e.target.value)}
                  placeholder="Student Name"
                  maxLength={100}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-gray-500">Role</Label>
                <Input
                  value={item.role}
                  onChange={(e) => updateItem(index, "role", e.target.value)}
                  placeholder="Course Graduate"
                  maxLength={100}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500">Quote</Label>
              <Input
                value={item.quote}
                onChange={(e) => updateItem(index, "quote", e.target.value)}
                placeholder="This platform changed my career."
                maxLength={500}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500">Avatar URL (optional)</Label>
              <Input
                value={item.avatar}
                onChange={(e) => updateItem(index, "avatar", e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                maxLength={500}
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
          Add Testimonial
        </Button>
      </div>
    </div>
  );
}
