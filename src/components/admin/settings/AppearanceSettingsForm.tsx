"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Check, ImageIcon } from "lucide-react";
import type { BrandingSettings } from "@/lib/repositories/settings.repository";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface AppearanceSettingsFormProps {
  readonly initialValues: BrandingSettings;
}

export function AppearanceSettingsForm({ initialValues }: AppearanceSettingsFormProps) {
  const [logoUrl, setLogoUrl] = React.useState(initialValues.logoUrl);
  const [faviconUrl, setFaviconUrl] = React.useState(initialValues.faviconUrl);
  const [primaryColor, setPrimaryColor] = React.useState(initialValues.primaryColor);
  const [secondaryColor, setSecondaryColor] = React.useState(initialValues.secondaryColor);
  const [bannerImageUrl, setBannerImageUrl] = React.useState(initialValues.bannerImageUrl);
  const [bannerTagline, setBannerTagline] = React.useState(initialValues.bannerTagline);

  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/settings/appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: logoUrl.trim(),
          faviconUrl: faviconUrl.trim(),
          primaryColor,
          secondaryColor,
          bannerImageUrl: bannerImageUrl.trim(),
          bannerTagline: bannerTagline.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      // Reload to apply CSS variable changes
      window.location.reload();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Brand Colors */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Brand Colors</h3>

        <div className="grid grid-cols-2 gap-4">
          {[
            {
              id: "primaryColor",
              label: "Primary Color",
              value: primaryColor,
              setter: setPrimaryColor,
              description: "Used for buttons, links, and highlights",
            },
            {
              id: "secondaryColor",
              label: "Secondary Color",
              value: secondaryColor,
              setter: setSecondaryColor,
              description: "Used for accents and secondary UI elements",
            },
          ].map(({ id, label, value, setter, description }) => (
            <div key={id}>
              <Label htmlFor={id}>{label}</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => { setter(e.target.value); setSaved(false); }}
                  className="h-9 w-12 rounded border border-input cursor-pointer p-0.5"
                  aria-label={`${label} color picker`}
                />
                <Input
                  id={id}
                  value={value}
                  onChange={(e) => { setter(e.target.value); setSaved(false); }}
                  placeholder="#1d4ed8"
                  maxLength={7}
                  className="font-mono"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            </div>
          ))}
        </div>

        {/* Live color preview */}
        <div className="flex gap-3 items-center">
          <div
            className="h-9 flex-1 rounded-lg"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            aria-label="Color gradient preview"
          />
          <span className="text-xs text-gray-400 whitespace-nowrap">Live preview</span>
        </div>
      </div>

      {/* Logo & Favicon */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Logo &amp; Favicon</h3>

        <div>
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
          />
          <p className="text-xs text-gray-500 mt-1">
            Paste a URL from Cloudinary, Imgur, or any image host. Recommended: PNG, 200×60px.
          </p>
          {logoUrl && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-8 max-w-[160px] object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span className="text-xs text-gray-500">Preview</span>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="faviconUrl">Favicon URL</Label>
          <div className="flex items-center gap-2">
            <Input
              id="faviconUrl"
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="https://example.com/favicon.ico"
            />
            {faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faviconUrl}
                alt="Favicon preview"
                className="h-6 w-6 rounded flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-gray-300 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Recommended: ICO or PNG, 32×32px.</p>
        </div>
      </div>

      {/* Banner */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Landing Page Banner</h3>

        <div>
          <Label htmlFor="bannerImageUrl">Banner Image URL</Label>
          <Input
            id="bannerImageUrl"
            value={bannerImageUrl}
            onChange={(e) => setBannerImageUrl(e.target.value)}
            placeholder="https://example.com/banner.jpg"
          />
          {bannerImageUrl && (
            <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 h-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerImageUrl}
                alt="Banner preview"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="bannerTagline">Banner Tagline</Label>
          <Input
            id="bannerTagline"
            value={bannerTagline}
            onChange={(e) => setBannerTagline(e.target.value)}
            placeholder="Your Path to a VA Career"
            maxLength={200}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        <Button type="submit" disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Appearance Settings"}
        </Button>
      </div>
    </form>
  );
}
