"use client";

import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";

export interface ImageContent {
  readonly url: string;
  readonly alt: string;
  readonly caption: string;
}

interface ImageFormProps {
  readonly content: ImageContent;
  readonly onChange: (content: ImageContent) => void;
}

export function ImageForm({ content, onChange }: ImageFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateField(field: keyof ImageContent, value: string): void {
    onChange({ ...content, [field]: value });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/corporate/upload", { method: "POST", body });
      const json = (await res.json()) as { success: boolean; url?: string; error?: string };
      if (!json.success || !json.url) {
        setUploadError(json.error ?? "Upload failed.");
        return;
      }
      onChange({ ...content, url: json.url });
    } catch {
      setUploadError("Network error during upload.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image-url" className="text-sm font-medium text-gray-700">
          Image URL
        </Label>
        <div className="flex gap-2">
          <Input
            id="image-url"
            value={content.url}
            onChange={(e) => updateField("url", e.target.value)}
            placeholder="https://example.com/image.jpg"
            maxLength={500}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2 shrink-0"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleUpload}
          aria-label="Upload image"
        />
        {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
      </div>
      {content.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={content.url}
          alt={content.alt || "Preview"}
          className="rounded-lg border border-gray-200 max-h-48 object-cover w-full"
        />
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image-alt" className="text-sm font-medium text-gray-700">
          Alt Text
        </Label>
        <Input
          id="image-alt"
          value={content.alt}
          onChange={(e) => updateField("alt", e.target.value)}
          placeholder="Descriptive alt text for accessibility"
          maxLength={300}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image-caption" className="text-sm font-medium text-gray-700">
          Caption (optional)
        </Label>
        <Input
          id="image-caption"
          value={content.caption}
          onChange={(e) => updateField("caption", e.target.value)}
          placeholder="Image caption"
          maxLength={300}
        />
      </div>
    </div>
  );
}
