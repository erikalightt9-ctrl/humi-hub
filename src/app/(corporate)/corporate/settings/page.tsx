"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Loader2,
  Building2,
  Palette,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrgSettings {
  readonly name: string;
  readonly industry: string | null;
  readonly maxSeats: number;
  readonly totalEmployees: number;
  readonly logoUrl: string | null;
  readonly primaryColor: string | null;
  readonly secondaryColor: string | null;
  readonly tagline: string | null;
  readonly bannerImageUrl: string | null;
  readonly mission: string | null;
  readonly vision: string | null;
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 max-w-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-5 w-5 text-gray-400" />
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      {description && <p className="text-xs text-gray-500 -mt-2">{description}</p>}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CorporateSettingsPage() {
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Org details
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");

  // Branding
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1d4ed8");
  const [secondaryColor, setSecondaryColor] = useState("#93c5fd");
  const [tagline, setTagline] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");

  // UI state (per-section saving)
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [brandingError, setBrandingError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/corporate/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const d: OrgSettings = json.data;
          setSettings(d);
          setName(d.name);
          setIndustry(d.industry ?? "");
          setLogoUrl(d.logoUrl ?? "");
          setPrimaryColor(d.primaryColor ?? "#1d4ed8");
          setSecondaryColor(d.secondaryColor ?? "#93c5fd");
          setTagline(d.tagline ?? "");
          setBannerImageUrl(d.bannerImageUrl ?? "");
          setMission(d.mission ?? "");
          setVision(d.vision ?? "");
        }
      })
      .catch(() => setDetailsError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSavingDetails(true);
    setDetailsError(null);
    setDetailsSuccess(false);

    try {
      const res = await fetch("/api/corporate/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), industry: industry.trim() || null }),
      });
      const json = await res.json();
      if (!json.success) { setDetailsError(json.error ?? "Failed to save"); return; }
      setSettings(json.data);
      setDetailsSuccess(true);
      setTimeout(() => setDetailsSuccess(false), 3000);
    } catch {
      setDetailsError("Network error. Please try again.");
    } finally {
      setSavingDetails(false);
    }
  }

  async function saveBranding(e: React.FormEvent) {
    e.preventDefault();
    setSavingBranding(true);
    setBrandingError(null);
    setBrandingSuccess(false);

    try {
      const res = await fetch("/api/corporate/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: logoUrl.trim() || null,
          primaryColor: primaryColor || null,
          secondaryColor: secondaryColor || null,
          tagline: tagline.trim() || null,
          bannerImageUrl: bannerImageUrl.trim() || null,
          mission: mission.trim() || null,
          vision: vision.trim() || null,
        }),
      });
      const json = await res.json();
      if (!json.success) { setBrandingError(json.error ?? "Failed to save"); return; }
      setSettings((prev) => prev ? { ...prev, ...json.data } : json.data);
      setBrandingSuccess(true);
      setTimeout(() => setBrandingSuccess(false), 3000);
    } catch {
      setBrandingError("Network error. Please try again.");
    } finally {
      setSavingBranding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-gray-100 rounded-lg p-2">
          <Settings className="h-5 w-5 text-gray-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your organization settings and branding</p>
        </div>
      </div>

      {/* ── Organization Details ── */}
      <Section icon={Building2} title="Organization Details">
        <form onSubmit={saveDetails} className="space-y-4">
          {detailsError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {detailsError}
            </div>
          )}
          {detailsSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Details saved successfully.
            </div>
          )}

          <div>
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Organization name"
              maxLength={200}
              required
            />
          </div>

          <div>
            <Label htmlFor="org-industry">Industry</Label>
            <Input
              id="org-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Healthcare, Technology"
              maxLength={100}
            />
          </div>

          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
            <span className="font-medium">{settings?.totalEmployees ?? 0}</span> of{" "}
            <span className="font-medium">{settings?.maxSeats ?? 10}</span> seats used
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{
                  width: `${Math.min(100, ((settings?.totalEmployees ?? 0) / (settings?.maxSeats ?? 10)) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={savingDetails} className="gap-2">
              {savingDetails && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Details
            </Button>
          </div>
        </form>
      </Section>

      {/* ── Branding ── */}
      <Section
        icon={Palette}
        title="Branding"
        description="Customize your portal's look and feel. Changes apply immediately to your organization's portal."
      >
        <form onSubmit={saveBranding} className="space-y-4">
          {brandingError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {brandingError}
            </div>
          )}
          {brandingSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Branding saved successfully.
            </div>
          )}

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Primary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-12 rounded border border-input cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#1d4ed8"
                  maxLength={7}
                />
              </div>
            </div>
            <div>
              <Label>Secondary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-9 w-12 rounded border border-input cursor-pointer"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#93c5fd"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Color preview */}
          <div
            className="rounded-lg p-3 text-white text-xs font-medium flex items-center gap-2"
            style={{ backgroundColor: primaryColor || "#1d4ed8" }}
          >
            <div
              className="w-4 h-4 rounded-full border-2 border-white/50"
              style={{ backgroundColor: secondaryColor || "#93c5fd" }}
            />
            Color preview
          </div>

          {/* Tagline */}
          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Empowering our team through learning"
              maxLength={200}
            />
          </div>

          {/* Image URLs */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="logo-url" className="flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" />
                Logo URL
              </Label>
              <Input
                id="logo-url"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://cdn.example.com/logo.png"
              />
            </div>
            <div>
              <Label htmlFor="banner-url" className="flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" />
                Banner Image URL
              </Label>
              <Input
                id="banner-url"
                type="url"
                value={bannerImageUrl}
                onChange={(e) => setBannerImageUrl(e.target.value)}
                placeholder="https://cdn.example.com/banner.jpg"
              />
            </div>
          </div>

          {/* Logo preview */}
          {logoUrl && (
            <div className="border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Logo preview" className="h-10 object-contain" />
              <p className="text-xs text-gray-400">Logo preview</p>
            </div>
          )}

          {/* Mission / Vision */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mission" className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Mission Statement
              </Label>
              <Textarea
                id="mission"
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="Our mission is…"
                rows={3}
                maxLength={1000}
              />
            </div>
            <div>
              <Label htmlFor="vision" className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Vision Statement
              </Label>
              <Textarea
                id="vision"
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="Our vision is…"
                rows={3}
                maxLength={1000}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={savingBranding} className="gap-2">
              {savingBranding && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Branding
            </Button>
          </div>
        </form>
      </Section>
    </div>
  );
}
