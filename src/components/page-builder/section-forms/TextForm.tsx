"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface TextContent {
  readonly title: string;
  readonly body: string;
}

interface TextFormProps {
  readonly content: TextContent;
  readonly onChange: (content: TextContent) => void;
}

export function TextForm({ content, onChange }: TextFormProps) {
  function updateField(field: keyof TextContent, value: string): void {
    onChange({ ...content, [field]: value });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="text-title" className="text-sm font-medium text-gray-700">
          Title (optional)
        </Label>
        <Input
          id="text-title"
          value={content.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="About Us"
          maxLength={200}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="text-body" className="text-sm font-medium text-gray-700">
          Body
        </Label>
        <textarea
          id="text-body"
          value={content.body}
          onChange={(e) => updateField("body", e.target.value)}
          placeholder="Tell your story here."
          maxLength={10000}
          rows={8}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[120px]"
        />
        <p className="text-xs text-gray-400 text-right">
          {content.body.length} / 10,000 characters
        </p>
      </div>
    </div>
  );
}
