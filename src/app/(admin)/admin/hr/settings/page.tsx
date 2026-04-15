"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Building2, Upload, Loader2, CheckCircle, AlertCircle,
  ImageIcon, X, Save, MapPin, Search, Navigation,
} from "lucide-react";
import Image from "next/image";

/* ─ Leaflet map loaded only client-side ─────────────────────────── */
const LeafletMap = dynamic(
  () => import("@/components/shared/LeafletMap").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-slate-100 rounded-xl" style={{ height: 260 }}>
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    ),
  }
);

interface OrgSettings {
  name: string;
  logoUrl: string | null;
  officeAddress: string | null;
  officeLatitude: number | null;
  officeLongitude: number | null;
  geofenceRadiusMeters: number;
}

export default function HrSettingsPage() {
  const [settings,        setSettings]        = useState<OrgSettings | null>(null);
  const [name,            setName]            = useState("");
  const [officeAddress,   setOfficeAddress]   = useState("");
  const [officeLatitude,  setOfficeLatitude]  = useState("");
  const [officeLongitude, setOfficeLongitude] = useState("");
  const [geofenceRadius,  setGeofenceRadius]  = useState("100");

  const [savingGeo,    setSavingGeo]    = useState(false);
  const [geoSuccess,   setGeoSuccess]   = useState(false);
  const [geoError,     setGeoError]     = useState<string | null>(null);
  const [gpsLoading,   setGpsLoading]   = useState(false);
  const [geocoding,    setGeocoding]    = useState(false);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBase64,  setLogoBase64]  = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Derived: map preview coords ─────────────────────────────── */
  const previewLat = parseFloat(officeLatitude)  || null;
  const previewLng = parseFloat(officeLongitude) || null;
  const hasCoords  = previewLat !== null && !isNaN(previewLat) &&
                     previewLng !== null && !isNaN(previewLng);

  /* ── Load current settings ───────────────────────────────────── */
  useEffect(() => {
    fetch("/api/admin/hr/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setSettings(json.data);
          setName(json.data.name ?? "");
          setLogoPreview(json.data.logoUrl ?? null);
          setOfficeAddress(json.data.officeAddress ?? "");
          setOfficeLatitude(json.data.officeLatitude?.toString() ?? "");
          setOfficeLongitude(json.data.officeLongitude?.toString() ?? "");
          setGeofenceRadius(json.data.geofenceRadiusMeters?.toString() ?? "100");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Logo file handling ───────────────────────────────────────── */
  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, SVG, etc.)");
      return;
    }
    if (file.size > 500_000) {
      setError("Logo file must be under 500 KB.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLogoPreview(dataUrl);
      setLogoBase64(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function removeLogo() {
    setLogoPreview(null);
    setLogoBase64("");
    if (fileRef.current) fileRef.current.value = "";
  }

  /* ── Save branding ───────────────────────────────────────────── */
  async function handleSave() {
    setSaving(true); setSuccess(false); setError(null);
    try {
      const body: Record<string, string> = { companyName: name };
      if (logoBase64 !== null) body.logoUrl = logoBase64;

      const res  = await fetch("/api/admin/hr/settings", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Save failed");
      setSettings(json.data);
      setLogoBase64(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  /* ── Save geofence ───────────────────────────────────────────── */
  async function handleSaveGeofence() {
    setSavingGeo(true); setGeoSuccess(false); setGeoError(null);
    try {
      const lat    = officeLatitude  ? parseFloat(officeLatitude)  : null;
      const lng    = officeLongitude ? parseFloat(officeLongitude) : null;
      const radius = parseInt(geofenceRadius, 10) || 100;

      const res  = await fetch("/api/admin/hr/settings", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officeAddress:        officeAddress.trim() || null,
          officeLatitude:       lat,
          officeLongitude:      lng,
          geofenceRadiusMeters: radius,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Save failed");
      setSettings((prev) => prev ? { ...prev, ...json.data } : json.data);
      setGeoSuccess(true);
      setTimeout(() => setGeoSuccess(false), 3000);
    } catch (e) {
      setGeoError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingGeo(false);
    }
  }

  /* ── Detect GPS ──────────────────────────────────────────────── */
  function detectCurrentLocation() {
    setGpsLoading(true); setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOfficeLatitude(pos.coords.latitude.toFixed(7));
        setOfficeLongitude(pos.coords.longitude.toFixed(7));
        setGpsLoading(false);
      },
      () => {
        setGeoError("Could not get location. Please enter coordinates manually or use the address search.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }

  /* ── Nominatim geocoding (address → lat/lng) ─────────────────── */
  async function geocodeAddress() {
    const addr = officeAddress.trim();
    if (!addr) { setGeoError("Enter an office address first."); return; }
    setGeocoding(true); setGeoError(null);
    try {
      const url  = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`;
      const res  = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json() as { lat: string; lon: string; display_name: string }[];
      if (!data.length) {
        setGeoError("Address not found. Try a more specific address (e.g. include city or country).");
        return;
      }
      setOfficeLatitude(parseFloat(data[0].lat).toFixed(7));
      setOfficeLongitude(parseFloat(data[0].lon).toFixed(7));
    } catch {
      setGeoError("Geocoding failed. Please enter coordinates manually.");
    } finally {
      setGeocoding(false);
    }
  }

  /* ── Loading skeleton ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-indigo-500" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">HR — Company Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Company branding, office location, and attendance geofencing.
          </p>
        </div>
      </div>

      {/* ══ Payslip Branding ════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-700">Payslip Branding</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            This information appears in the top-left corner of every payslip PDF.
          </p>
        </div>

        <div className="px-6 py-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-sm">
              <CheckCircle className="h-4 w-4 shrink-0" /> Settings saved!
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              placeholder="e.g. Acme Corp Philippines Inc."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Logo</label>
            {logoPreview ? (
              <div className="relative inline-block border border-slate-200 rounded-xl p-3 bg-slate-50">
                <Image src={logoPreview} alt="Logo preview" width={200} height={80}
                  className="h-20 w-auto object-contain" unoptimized />
                <button onClick={removeLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow"
                  title="Remove logo">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">Click to upload or drag &amp; drop</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, SVG · Max 500 KB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {!logoPreview && (
              <button onClick={() => fileRef.current?.click()}
                className="mt-3 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                <Upload className="h-4 w-4" /> Upload Logo
              </button>
            )}
          </div>

          {/* Payslip header preview */}
          {(name || logoPreview) && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Payslip Header Preview</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {logoPreview && (
                    <Image src={logoPreview} alt="Logo" width={120} height={44}
                      className="h-11 w-auto object-contain" unoptimized />
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-800">{name || "Your Company"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-600">PAYSLIP</p>
                  <p className="text-xs text-slate-400">Run: PR-2026-0001</p>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 shadow-sm">
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
              : <><Save className="h-4 w-4" />Save Settings</>}
          </button>
        </div>
      </div>

      {/* ══ Attendance Geofencing ════════════════════════════════════ */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-indigo-500" />
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Attendance Geofencing</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Employees must be within the perimeter to clock in or out. Syncs to all employee devices.
            </p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-5">
          {geoError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" /> {geoError}
            </div>
          )}
          {geoSuccess && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-sm">
              <CheckCircle className="h-4 w-4 shrink-0" /> Geofence settings saved and synced to employees.
            </div>
          )}

          {/* Office address + geocode */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Office Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={officeAddress}
                onChange={(e) => setOfficeAddress(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); geocodeAddress(); } }}
                placeholder="e.g. 123 Ayala Ave, Makati City, Philippines"
                maxLength={300}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800"
              />
              <button
                type="button"
                onClick={geocodeAddress}
                disabled={geocoding || !officeAddress.trim()}
                title="Find coordinates from this address"
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {geocoding
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Search className="h-4 w-4" />}
                Find
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Press <kbd className="bg-slate-100 px-1 rounded text-slate-500">Enter</kbd> or click <strong>Find</strong> to auto-fill coordinates from this address.
            </p>
          </div>

          {/* Lat / Lng */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Latitude</label>
              <input
                type="number"
                step="any"
                value={officeLatitude}
                onChange={(e) => setOfficeLatitude(e.target.value)}
                placeholder="e.g. 14.5547"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Longitude</label>
              <input
                type="number"
                step="any"
                value={officeLongitude}
                onChange={(e) => setOfficeLongitude(e.target.value)}
                placeholder="e.g. 121.0244"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800 font-mono"
              />
            </div>
          </div>

          {/* GPS / detect location shortcut */}
          <button
            type="button"
            onClick={detectCurrentLocation}
            disabled={gpsLoading}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 transition-colors"
          >
            {gpsLoading
              ? <><Loader2 className="h-4 w-4 animate-spin" />Detecting…</>
              : <><Navigation className="h-4 w-4" />Use My Current Location</>}
          </button>

          {/* Radius */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Geofence Radius (meters)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={10}
                max={50000}
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(e.target.value)}
                className="w-36 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800"
              />
              {/* Quick-select presets */}
              <div className="flex gap-1.5">
                {[50, 100, 200, 500].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setGeofenceRadius(String(r))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                      geofenceRadius === String(r)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {r}m
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">Min 10m · Recommended 100–300m for a single building.</p>
          </div>

          {/* ── Live map preview ──────────────────────────────────── */}
          {hasCoords && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Office Location Preview</span>
                {geofenceRadius && (
                  <span className="ml-auto text-xs text-slate-400">
                    {geofenceRadius}m perimeter
                  </span>
                )}
              </div>
              <LeafletMap
                key={`${officeLatitude}-${officeLongitude}-${geofenceRadius}`}
                center={{ lat: previewLat!, lng: previewLng! }}
                radiusMeters={parseInt(geofenceRadius, 10) || 100}
                height="280px"
                zoom={16}
              />
              {officeAddress && (
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
                  {officeAddress}
                </div>
              )}
            </div>
          )}

          {!hasCoords && (officeLatitude || officeLongitude) && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Enter valid latitude and longitude (or use address search) to preview the map.
            </p>
          )}

          <button
            onClick={handleSaveGeofence}
            disabled={savingGeo}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 shadow-sm"
          >
            {savingGeo
              ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
              : <><Save className="h-4 w-4" />Save &amp; Sync to Employees</>}
          </button>
        </div>
      </div>
    </div>
  );
}
