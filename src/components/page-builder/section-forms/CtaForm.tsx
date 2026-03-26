"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface CtaContent {
  readonly headline: string;
  readonly subheadline: string;
  readonly buttonText: string;
  readonly buttonLink: string;
}

interface CtaFormProps {
  readonly content: CtaContent;
  readonly onChange: (content: CtaContent) => void;
}

export function CtaForm({ content, onChange }: CtaFormProps) {
  function updateField(field: keyof CtaContent, value: string): void {
    onChange({ ...content, [field]: value });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cta-headline" className="text-sm font-medium text-gray-700">
          Headline
        </Label>
        <Input
          id="cta-headline"
          value={content.headline}
          onChange={(e) => updateField("headline", e.target.value)}
          placeholder="Ready to Start Learning?"
          maxLength={200}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cta-subheadline" className="text-sm font-medium text-gray-700">
          Subheadline
        </Label>
        <Input
          id="cta-subheadline"
          value={content.subheadline}
          onChange={(e) => updateField("subheadline", e.target.value)}
          placeholder="Join thousands of students today"
          maxLength={400}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cta-button-text" className="text-sm font-medium text-gray-700">
            Button Text
          </Label>
          <Input
            id="cta-button-text"
            value={content.buttonText}
            onChange={(e) => updateField("buttonText", e.target.value)}
            placeholder="Enroll Now"
            maxLength={100}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cta-button-link" className="text-sm font-medium text-gray-700">
            Button Link
          </Label>
          <Input
            id="cta-button-link"
            value={content.buttonLink}
            onChange={(e) => updateField("buttonLink", e.target.value)}
            placeholder="/enroll"
            maxLength={500}
          />
        </div>
      </div>
    </div>
  );
}
