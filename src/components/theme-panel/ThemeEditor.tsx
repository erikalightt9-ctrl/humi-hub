"use client";

import { useState, useRef } from "react";
import { Loader2, Upload, CheckCircle, AlertCircle, Palette, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "./ColorPicker";
import { FontSelector } from "./FontSelector";
import { ThemePreview } from "./ThemePreview";
import {
  TypographySizeSelector,
  HEADING_SIZE_OPTIONS,
  BODY_SIZE_OPTIONS,
} from "./TypographySizeSelector";
import type { TenantTheme } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type TenantThemeData = TenantTheme;

interface ThemeEditorProps {
  readonly initialTheme: TenantThemeData | null;
}

interface FormState {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
  readonly fontHeading: string;
  readonly fontBody: string;
  readonly logoUrl: string;
  readonly businessName: string;
  readonly tagline: string;
  readonly headingSize: string;
  readonly bodySize: string;
}

const DEFAULT_FORM: FormState = {
  primaryColor: "#3B82F6",
  secondaryColor: "#1E40AF",
  accentColor: "#F59E0B",
  fontHeading: "Inter",
  fontBody: "Inter",
  logoUrl: "",
  businessName: "My Business",
  tagline: "Your trusted learning partner",
  headingSize: "md",
  bodySize: "md",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function initFormState(theme: TenantThemeData | null): FormState {
  if (!theme) return DEFAULT_FORM;
  return {
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    accentColor: theme.accentColor,
    fontHeading: theme.fontHeading,
    fontBody: theme.fontBody,
    logoUrl: theme.logoUrl ?? "",
    businessName: DEFAULT_FORM.businessName,
    tagline: DEFAULT_FORM.tagline,
    headingSize: (theme as TenantTheme & { headingSize?: string }).headingSize ?? "md",
    bodySize: (theme as TenantTheme & { bodySize?: string }).bodySize ?? "md",
  };
}

/* ------------------------------------------------------------------ */
/*  Section heading helper                                             */
/* ------------------------------------------------------------------ */

function SectionHeading({ children }: { readonly children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
      {children}
    </h3>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ThemeEditor({ initialTheme }: ThemeEditorProps) {
  const [form, setForm] = useState<FormState>(() => initFormState(initialTheme));
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  /* ── Immutable field update helper ── */
  function updateField<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccessMsg(null);
    setErrorMsg(null);
  }

  /* ── Reset to defaults ── */
  function handleReset(): void {
    setForm(DEFAULT_FORM);
    setSuccessMsg(null);
    setErrorMsg(null);
  }

  /* ── Logo upload ── */
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/corporate/upload", { method: "POST", body });
      const json = (await res.json()) as { success: boolean; url?: string; error?: string };

      if (!json.success || !json.url) {
        setErrorMsg(json.error ?? "Logo upload failed.");
        return;
      }

      updateField("logoUrl", json.url);
    } catch {
      setErrorMsg("Network error during logo upload.");
    } finally {
      setUploadingLogo(false);
      // Reset file input so re-selecting the same file triggers onChange again
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  /* ── Save ── */
  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const payload = {
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        accentColor: form.accentColor,
        fontHeading: form.fontHeading,
        fontBody: form.fontBody,
        logoUrl: form.logoUrl || null,
        headingSize: form.headingSize,
        bodySize: form.bodySize,
      };

      const res = await fetch("/api/corporate/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as { success: boolean; error?: string };

      if (!json.success) {
        setErrorMsg(json.error ?? "Failed to save theme.");
        return;
      }

      setSuccessMsg("Theme saved successfully!");
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ── Preview data ── */
  const previewTheme = {
    primaryColor: form.primaryColor,
    secondaryColor: form.secondaryColor,
    accentColor: form.accentColor,
    fontFamily: form.fontHeading,
    logoUrl: form.logoUrl || null,
    businessName: form.businessName,
    tagline: form.tagline,
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* ── Left panel: form ── */}
        <div className="flex-1 min-w-0 space-y-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {/* Colors */}
          <div>
            <SectionHeading>Brand Colors</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ColorPicker
                label="Primary Color"
                value={form.primaryColor}
                onChange={(v) => updateField("primaryColor", v)}
              />
              <ColorPicker
                label="Secondary Color"
                value={form.secondaryColor}
                onChange={(v) => updateField("secondaryColor", v)}
              />
              <ColorPicker
                label="Accent Color"
                value={form.accentColor}
                onChange={(v) => updateField("accentColor", v)}
              />
            </div>
          </div>

          {/* Typography */}
          <div>
            <SectionHeading>Typography</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FontSelector
                label="Heading Font"
                value={form.fontHeading}
                onChange={(v) => updateField("fontHeading", v)}
              />
              <FontSelector
                label="Body Font"
                value={form.fontBody}
                onChange={(v) => updateField("fontBody", v)}
              />
              <TypographySizeSelector
                label="Heading Size"
                value={form.headingSize}
                options={HEADING_SIZE_OPTIONS}
                onChange={(v) => updateField("headingSize", v)}
              />
              <TypographySizeSelector
                label="Body Size"
                value={form.bodySize}
                options={BODY_SIZE_OPTIONS}
                onChange={(v) => updateField("bodySize", v)}
              />
            </div>
          </div>

          {/* Business identity */}
          <div>
            <SectionHeading>Business Identity</SectionHeading>
            <div className="space-y-3">
              {/* Business name */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">
                  Business Name
                </Label>
                <Input
                  id="businessName"
                  value={form.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  placeholder="My Business"
                  maxLength={100}
                />
              </div>

              {/* Tagline */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tagline" className="text-sm font-medium text-gray-700">
                  Tagline
                </Label>
                <Input
                  id="tagline"
                  value={form.tagline}
                  onChange={(e) => updateField("tagline", e.target.value)}
                  placeholder="Your trusted learning partner"
                  maxLength={200}
                />
              </div>

              {/* Logo */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-gray-700">Logo</Label>
                <div className="flex items-center gap-3">
                  {form.logoUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={form.logoUrl}
                      alt="Logo preview"
                      className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                    />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="gap-2"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingLogo ? "Uploading…" : "Upload Logo"}
                  </Button>
                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={() => updateField("logoUrl", "")}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoUpload}
                  aria-label="Upload logo image"
                />
                <p className="text-xs text-gray-400">JPEG, PNG, WebP or SVG — max 2 MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel: preview ── */}
        <div className="xl:w-[420px] shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700">Live Preview</h3>
            </div>
            <ThemePreview theme={previewTheme} />
          </div>
        </div>
      </div>

      {/* ── Status messages ── */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
        <Button type="submit" disabled={saving} className="gap-2 px-6">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : "Save Theme"}
        </Button>
      </div>
    </form>
  );
}
