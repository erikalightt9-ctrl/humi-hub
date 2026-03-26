"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface ContactContent {
  readonly title: string;
  readonly description: string;
  readonly showForm: boolean;
}

interface ContactFormProps {
  readonly content: ContactContent;
  readonly onChange: (content: ContactContent) => void;
}

export function ContactForm({ content, onChange }: ContactFormProps) {
  function updateField(field: keyof ContactContent, value: string | boolean): void {
    onChange({ ...content, [field]: value });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-title" className="text-sm font-medium text-gray-700">
          Title
        </Label>
        <Input
          id="contact-title"
          value={content.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Get In Touch"
          maxLength={200}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-description" className="text-sm font-medium text-gray-700">
          Description
        </Label>
        <Input
          id="contact-description"
          value={content.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="We'd love to hear from you."
          maxLength={500}
        />
      </div>
      <div className="flex items-center gap-3">
        <input
          id="contact-show-form"
          type="checkbox"
          checked={content.showForm}
          onChange={(e) => updateField("showForm", e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <Label htmlFor="contact-show-form" className="text-sm font-medium text-gray-700 cursor-pointer">
          Show contact form
        </Label>
      </div>
      <p className="text-xs text-gray-400 -mt-2">
        When enabled, a contact form will appear below the title and description.
      </p>
    </div>
  );
}
