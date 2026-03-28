"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface HeroContent {
  readonly headline: string;
  readonly subheadline: string;
  readonly backgroundImage: string;
  readonly ctaText: string;
  readonly ctaLink: string;
}

interface HeroFormProps {
  readonly content: HeroContent;
  readonly onChange: (content: HeroContent) => void;
}

export function HeroForm({ content, onChange }: HeroFormProps) {
  function updateField(field: keyof HeroContent, value: string): void {
    onChange({ ...content, [field]: value });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="hero-headline" className="text-sm font-medium text-gray-700">
          Headline
        </Label>
        <Input
          id="hero-headline"
          value={content.headline}
          onChange={(e) => updateField("headline", e.target.value)}
          placeholder="Welcome to Our Platform"
          maxLength={200}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="hero-subheadline" className="text-sm font-medium text-gray-700">
          Subheadline
        </Label>
        <Input
          id="hero-subheadline"
          value={content.subheadline}
          onChange={(e) => updateField("subheadline", e.target.value)}
          placeholder="Your trusted learning partner"
          maxLength={400}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="hero-bg" className="text-sm font-medium text-gray-700">
          Background Image URL
        </Label>
        <Input
          id="hero-bg"
          value={content.backgroundImage}
          onChange={(e) => updateField("backgroundImage", e.target.value)}
          placeholder="https://example.com/image.jpg"
          maxLength={500}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hero-cta-text" className="text-sm font-medium text-gray-700">
            Button Text
          </Label>
          <Input
            id="hero-cta-text"
            value={content.ctaText}
            onChange={(e) => updateField("ctaText", e.target.value)}
            placeholder="Get Started"
            maxLength={100}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hero-cta-link" className="text-sm font-medium text-gray-700">
            Button Link
          </Label>
          <Input
            id="hero-cta-link"
            value={content.ctaLink}
            onChange={(e) => updateField("ctaLink", e.target.value)}
            placeholder="/enroll"
            maxLength={500}
          />
        </div>
      </div>
    </div>
  );
}
