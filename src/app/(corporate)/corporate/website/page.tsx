"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SiteData {
  name: string;
  subdomain: string | null;
  tagline: string | null;
  mission: string | null;
  vision: string | null;
  logoUrl: string | null;
  bannerImageUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

// ---------------------------------------------------------------------------
// Live preview
// ---------------------------------------------------------------------------

function SitePreview({ data }: { data: SiteData }) {
  const primary = data.primaryColor ?? "#1d4ed8";
  const secondary = data.secondaryColor ?? "#93c5fd";

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm text-sm">
      {/* Browser chrome */}
      <div className="bg-gray-100 border-b border-gray-200 px-3 py-1.5 flex items-center gap-2">
        <div className="flex gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <span className="text-xs text-gray-400 ml-1 font-mono truncate">
          {data.subdomain ? `${data.subdomain}.humihub.com` : "yourorg.humihub.com"}
        </span>
      </div>

      {/* Simulated page */}
      <div className="bg-white">
        {/* Navbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100" style={{ borderBottomColor: `${primary}22` }}>
          {data.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.logoUrl} alt="Logo" className="h-6 object-contain" />
          ) : (
            <div className="h-6 w-6 rounded" style={{ backgroundColor: primary }} />
          )}
          <span className="font-bold text-xs" style={{ color: primary }}>{data.name}</span>
        </div>

        {/* Hero */}
        <div
          className="px-5 py-8 text-center text-white"
          style={{
            background: data.bannerImageUrl
              ? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${data.bannerImageUrl}) center/cover`
              : `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
          }}
        >
          <h1 className="text-base font-bold leading-snug">{data.name}</h1>
          {data.tagline && (
            <p className="text-xs mt-1 text-white/80">{data.tagline}</p>
          )}
          <button
            className="mt-4 text-xs font-semibold px-4 py-1.5 rounded-full"
            style={{ backgroundColor: secondary, color: primary }}
          >
            Get Started
          </button>
        </div>

        {/* Mission / Vision */}
        {(data.mission || data.vision) && (
          <div className="grid grid-cols-2 gap-3 px-5 py-5 bg-gray-50">
            {data.mission && (
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: primary }}>Our Mission</p>
                <p className="text-xs text-gray-500 line-clamp-3">{data.mission}</p>
              </div>
            )}
            {data.vision && (
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: primary }}>Our Vision</p>
                <p className="text-xs text-gray-500 line-clamp-3">{data.vision}</p>
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-3 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-300">© {new Date().getFullYear()} {data.name}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WebsiteBuilderPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  // Editable fields
  const [tagline, setTagline]               = useState("");
  const [mission, setMission]               = useState("");
  const [vision, setVision]                 = useState("");
  const [logoUrl, setLogoUrl]               = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [primaryColor, setPrimaryColor]     = useState("#1d4ed8");
  const [secondaryColor, setSecondaryColor] = useState("#93c5fd");
  const [orgName, setOrgName]               = useState("");

  useEffect(() => {
    fetch("/api/corporate/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const d = json.data;
          setOrgName(d.name ?? "");
          setTagline(d.tagline ?? "");
          setMission(d.mission ?? "");
          setVision(d.vision ?? "");
          setLogoUrl(d.logoUrl ?? "");
          setBannerImageUrl(d.bannerImageUrl ?? "");
          setPrimaryColor(d.primaryColor ?? "#1d4ed8");
          setSecondaryColor(d.secondaryColor ?? "#93c5fd");
          setSubdomain(d.subdomain ?? null);
        }
      })
      .catch(() => setError("Failed to load site data"))
      .finally(() => setLoading(false));
  }, []);

  const preview: SiteData = {
    name: orgName,
    subdomain,
    tagline: tagline || null,
    mission: mission || null,
    vision: vision || null,
    logoUrl: logoUrl || null,
    bannerImageUrl: bannerImageUrl || null,
    primaryColor: primaryColor || null,
    secondaryColor: secondaryColor || null,
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/corporate/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: tagline.trim() || null,
          mission: mission.trim() || null,
          vision: vision.trim() || null,
          logoUrl: logoUrl.trim() || null,
          bannerImageUrl: bannerImageUrl.trim() || null,
          primaryColor: primaryColor || null,
          secondaryColor: secondaryColor || null,
        }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error ?? "Failed to save"); return; }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 rounded-lg p-2">
            <Globe className="h-5 w-5 text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Website Builder</h1>
            <p className="text-sm text-gray-500">
              Customize your public-facing organization website
            </p>
          </div>
        </div>
        {subdomain && (
          <a
            href={`${window.location.protocol}//${subdomain}.${window.location.host.replace(/^[^.]+\./, "")}/site`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-blue-700 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View live site
          </a>
        )}
      </div>

      {/* Two-column: form + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Form */}
        <form onSubmit={handleSave} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Website updated successfully.
            </div>
          )}

          {/* Colors */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm">Colors</h2>
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
                <Label>Accent Color</Label>
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
          </div>

          {/* Media */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm">Media</h2>
            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://cdn.example.com/logo.png"
              />
            </div>
            <div>
              <Label htmlFor="bannerUrl">Hero Banner Image URL</Label>
              <Input
                id="bannerUrl"
                type="url"
                value={bannerImageUrl}
                onChange={(e) => setBannerImageUrl(e.target.value)}
                placeholder="https://cdn.example.com/banner.jpg"
              />
              <p className="text-xs text-gray-400 mt-1">
                Recommended: 1200 × 400 px. Shown as the hero background.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm">Content</h2>
            <div>
              <Label htmlFor="tagline">Tagline / Hero Subtitle</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Empowering our team through learning"
                maxLength={200}
              />
            </div>
            <div>
              <Label htmlFor="mission">Mission Statement</Label>
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
              <Label htmlFor="vision">Vision Statement</Label>
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
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>

        {/* Live preview */}
        <div className="space-y-3 lg:sticky lg:top-6">
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
            <Monitor className="h-4 w-4" />
            Live Preview
          </div>
          <SitePreview data={preview} />
          <p className="text-xs text-gray-400 text-center">
            Preview updates as you type. Save to publish changes.
          </p>
        </div>
      </div>
    </div>
  );
}
