"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Loader2, AlertCircle, CheckCircle, XCircle, AlertTriangle, Clock,
  Upload, FileSpreadsheet, FileImage, FileText, X, Check,
  CloudUpload, RefreshCw, Map, List, MapPin, Camera, Eye,
} from "lucide-react";
import type { MapMarker } from "@/components/shared/LeafletMap";

/* ─ Leaflet loaded only client-side (no SSR) ─────────────────────── */
const LeafletMap = dynamic(
  () => import("@/components/shared/LeafletMap").then((m) => m.LeafletMap),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full bg-slate-50 rounded-xl"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div> }
);

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  hoursWorked: number | null;
  overtimeHours: number | null;
  status: string;
  clockInLatitude: number | null;
  clockInLongitude: number | null;
  clockInPhotoUrl: string | null;
  clockOutLatitude: number | null;
  clockOutLongitude: number | null;
  clockOutPhotoUrl: string | null;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    position: string;
    department: string | null;
  };
}

interface ExtractedRow {
  employeeNumber: string | null;
  employeeName:   string | null;
  date:           string;
  clockIn:        string | null;
  clockOut:       string | null;
  status:         string;
  hoursWorked:    number | null;
  overtimeHours:  number | null;
}

interface GeofenceConfig {
  officeAddress: string | null;
  officeLatitude: number | null;
  officeLongitude: number | null;
  geofenceRadiusMeters: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const STATUS_ICON: Record<string, React.ReactNode> = {
  PRESENT:  <CheckCircle   className="h-4 w-4 text-green-500" />,
  LATE:     <AlertTriangle className="h-4 w-4 text-amber-500" />,
  ABSENT:   <XCircle       className="h-4 w-4 text-red-400" />,
  HALF_DAY: <Clock         className="h-4 w-4 text-blue-400" />,
  ON_LEAVE: <Clock         className="h-4 w-4 text-purple-400" />,
};

const STATUS_BADGE: Record<string, string> = {
  PRESENT:  "bg-green-100 text-green-700",
  LATE:     "bg-amber-100 text-amber-700",
  ABSENT:   "bg-red-100 text-red-600",
  HALF_DAY: "bg-blue-100 text-blue-700",
  ON_LEAVE: "bg-purple-100 text-purple-700",
};

const VALID_STATUSES = ["PRESENT", "LATE", "ABSENT", "HALF_DAY", "ON_LEAVE"] as const;

const fmtTime = (dt: string | null) =>
  dt ? new Date(dt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) : "—";

/* ------------------------------------------------------------------ */
/*  Photo Modal                                                         */
/* ------------------------------------------------------------------ */

function PhotoModal({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg z-10"
        >
          <X className="h-4 w-4 text-slate-600" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name} className="w-full rounded-2xl shadow-2xl" />
        <p className="text-center text-white text-sm mt-3 font-medium">{name}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Upload Modal                                                         */
/* ------------------------------------------------------------------ */

function UploadModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const fileRef   = useRef<HTMLInputElement>(null);
  const [dragging,   setDragging]   = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [rows,       setRows]       = useState<ExtractedRow[] | null>(null);
  const [editRows,   setEditRows]   = useState<ExtractedRow[]>([]);
  const [saveResult, setSaveResult] = useState<{ saved: number; skipped: number; errors: string[] } | null>(null);
  const [fileName,   setFileName]   = useState<string>("");

  async function handleFile(file: File) {
    setError(null); setRows(null); setSaveResult(null);
    setFileName(file.name); setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/admin/hr/attendance/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Extraction failed");
      if (json.data.length === 0) throw new Error("No attendance records found in this file.");
      setRows(json.data); setEditRows(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function updateRow(idx: number, field: keyof ExtractedRow, value: string) {
    setEditRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value || null };
      return next;
    });
  }

  function removeRow(idx: number) {
    setEditRows((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (editRows.length === 0) return;
    setSaving(true); setError(null);
    try {
      const res  = await fetch("/api/admin/hr/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: editRows }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Save failed");
      setSaveResult(json.data); onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const fileIcon = (name: string) => {
    if (name.match(/\.(xlsx?|csv)$/i)) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    if (name.match(/\.pdf$/i))         return <FileText        className="h-5 w-5 text-red-500" />;
    return                                    <FileImage       className="h-5 w-5 text-blue-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CloudUpload className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-800">Import Attendance</h2>
            {fileName && (
              <div className="flex items-center gap-1.5 ml-2 bg-slate-100 rounded-lg px-2.5 py-1 text-xs text-slate-600">
                {fileIcon(fileName)}
                <span className="max-w-[160px] truncate">{fileName}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!rows && !uploading && (
            <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5"><FileSpreadsheet className="h-4 w-4 text-green-500" /> Excel (.xlsx, .xls, .csv)</div>
              <div className="flex items-center gap-1.5"><FileText        className="h-4 w-4 text-red-400" />   PDF — AI extracted</div>
              <div className="flex items-center gap-1.5"><FileImage       className="h-4 w-4 text-blue-400" />  Image — AI extracted</div>
            </div>
          )}

          {!rows && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
                ${dragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"}`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                  <p className="text-sm font-medium">Extracting attendance data…</p>
                  <p className="text-xs text-slate-400">AI is reading your document</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Upload className="h-10 w-10 text-indigo-300" />
                  <p className="text-sm font-semibold text-slate-600">Drop file here or click to browse</p>
                  <p className="text-xs">Excel, CSV, PDF, or image (PNG/JPG)</p>
                </div>
              )}
            </div>
          )}

          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.webp"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}
            </div>
          )}

          {saveResult && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                <Check className="h-5 w-5" />Import complete!
              </div>
              <p className="text-sm text-green-600">
                ✅ {saveResult.saved} records saved · ⚠️ {saveResult.skipped} skipped
              </p>
            </div>
          )}

          {rows && !saveResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">{editRows.length} records — review before saving</p>
                <button type="button" onClick={() => { setRows(null); setEditRows([]); setFileName(""); }}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Upload different file
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 uppercase bg-slate-50 border border-slate-200">
                      <th className="px-3 py-2 text-left">Emp No.</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-center">In</th>
                      <th className="px-3 py-2 text-center">Out</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2 text-right">Hrs</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 border border-t-0 border-slate-200">
                    {editRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2"><input value={r.employeeNumber ?? ""} onChange={(e) => updateRow(i, "employeeNumber", e.target.value)} className="w-24 border border-slate-200 rounded px-1.5 py-0.5 text-xs" /></td>
                        <td className="px-3 py-2"><input value={r.employeeName ?? ""} onChange={(e) => updateRow(i, "employeeName", e.target.value)} className="w-32 border border-slate-200 rounded px-1.5 py-0.5 text-xs" /></td>
                        <td className="px-3 py-2"><input type="date" value={r.date} onChange={(e) => updateRow(i, "date", e.target.value)} className="border border-slate-200 rounded px-1.5 py-0.5 text-xs" /></td>
                        <td className="px-3 py-2 text-center"><input type="time" value={r.clockIn ?? ""} onChange={(e) => updateRow(i, "clockIn", e.target.value)} className="border border-slate-200 rounded px-1.5 py-0.5 text-xs" /></td>
                        <td className="px-3 py-2 text-center"><input type="time" value={r.clockOut ?? ""} onChange={(e) => updateRow(i, "clockOut", e.target.value)} className="border border-slate-200 rounded px-1.5 py-0.5 text-xs" /></td>
                        <td className="px-3 py-2 text-center">
                          <select value={r.status} onChange={(e) => updateRow(i, "status", e.target.value)}
                            className={`border border-slate-200 rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_BADGE[r.status] ?? ""}`}>
                            {VALID_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-600">{r.hoursWorked != null ? r.hoursWorked.toFixed(1) : "—"}</td>
                        <td className="px-3 py-2"><button type="button" onClick={() => removeRow(i)} className="text-slate-300 hover:text-red-400"><X className="h-3.5 w-3.5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {rows && !saveResult && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-2xl">
            <p className="text-xs text-slate-400">Employee must exist in the system.</p>
            <button onClick={handleSave} disabled={saving || editRows.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><CloudUpload className="h-4 w-4" />Import {editRows.length} Records</>}
            </button>
          </div>
        )}
        {saveResult && (
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end rounded-b-2xl">
            <button onClick={onClose} className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                            */
/* ------------------------------------------------------------------ */

export default function AttendancePage() {
  const [records,    setRecords]    = useState<AttendanceRecord[]>([]);
  const [geofence,   setGeofence]   = useState<GeofenceConfig | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [date,       setDate]       = useState(new Date().toISOString().split("T")[0]);
  const [view,       setView]       = useState<"list" | "map">("list");
  const [showUpload, setShowUpload] = useState(false);
  const [photoModal, setPhotoModal] = useState<{ src: string; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [attRes, geoRes] = await Promise.all([
        fetch(`/api/admin/hr/attendance?date=${date}`),
        fetch("/api/admin/hr/settings"),
      ]);
      const attJson = await attRes.json();
      const geoJson = await geoRes.json();
      if (!attJson.success) throw new Error(attJson.error);
      setRecords(attJson.data);
      if (geoJson.success) setGeofence(geoJson.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const present = records.filter((r) => r.status === "PRESENT").length;
  const late    = records.filter((r) => r.status === "LATE").length;
  const absent  = records.filter((r) => r.status === "ABSENT").length;

  /* Build map markers from records that have GPS coordinates */
  const mapMarkers = useMemo<MapMarker[]>(() =>
    records
      .filter((r) => r.clockInLatitude != null && r.clockInLongitude != null)
      .map((r) => ({
        lat:      r.clockInLatitude!,
        lng:      r.clockInLongitude!,
        label:    `${r.employee.firstName} ${r.employee.lastName}`,
        sublabel: `Clock in: ${fmtTime(r.clockIn)} · ${r.status}`,
        photoUrl: r.clockInPhotoUrl,
        kind:     "employee" as const,
      })),
    [records]
  );

  const hasOfficeCoords =
    geofence?.officeLatitude != null && geofence?.officeLongitude != null;

  const mapCenter = hasOfficeCoords
    ? { lat: geofence!.officeLatitude!, lng: geofence!.officeLongitude! }
    : mapMarkers.length > 0
      ? { lat: mapMarkers[0].lat, lng: mapMarkers[0].lng }
      : null;

  return (
    <>
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onImported={() => { load(); }} />
      )}
      {photoModal && (
        <PhotoModal src={photoModal.src} name={photoModal.name} onClose={() => setPhotoModal(null)} />
      )}

      <div className="p-6 space-y-6">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Attendance</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Daily clock-in / clock-out monitoring
              {geofence?.officeAddress && (
                <span className="ml-2 inline-flex items-center gap-1 text-indigo-600">
                  <MapPin className="h-3 w-3" />{geofence.officeAddress}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => setView("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === "list" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <List className="h-4 w-4" />List
              </button>
              <button
                onClick={() => setView("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === "map" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Map className="h-4 w-4" />Live Map
              </button>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Upload className="h-4 w-4" />Import
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* ── Summary cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Present</p>
              <p className="text-xl font-bold text-green-700">{present}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Late</p>
              <p className="text-xl font-bold text-amber-600">{late}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Absent</p>
              <p className="text-xl font-bold text-red-600">{absent}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error}</span>
          </div>
        )}

        {/* ── Empty import hint ───────────────────────────────────── */}
        {!loading && records.length === 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-start gap-4">
            <Upload className="h-8 w-8 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-indigo-700">No records for this date</p>
              <p className="text-xs text-indigo-500 mt-0.5">
                Click <strong>Import</strong> to upload an Excel sheet, PDF, or photo of the attendance logbook.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {/* ══ MAP VIEW ══════════════════════════════════════════ */}
            {view === "map" && (
              <div className="space-y-4">
                {!mapCenter ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Office location not configured</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Set your office coordinates in <strong>HR → Settings → Geofencing</strong> to see the perimeter on the map.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    {/* Map header */}
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Map className="h-4 w-4 text-indigo-500" />
                        <span className="text-sm font-semibold text-slate-700">Live Clock-In Map</span>
                        <span className="text-xs text-slate-400">— {new Date(date).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                          {mapMarkers.length} clocked in with GPS
                        </span>
                        {geofence?.geofenceRadiusMeters && (
                          <span className="flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded-full bg-indigo-500 opacity-40" />
                            {geofence.geofenceRadiusMeters}m perimeter
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      {mapMarkers.length === 0 && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                          <div className="bg-white/90 rounded-xl px-4 py-2 shadow text-sm text-slate-500">
                            No GPS clock-ins today
                          </div>
                        </div>
                      )}
                      <div className="relative" style={{ height: "460px" }}>
                        <LeafletMap
                          key={`${date}-${mapMarkers.length}`}
                          center={mapCenter}
                          radiusMeters={geofence?.geofenceRadiusMeters ?? 0}
                          markers={mapMarkers}
                          height="460px"
                          zoom={16}
                        />
                      </div>
                    </div>

                    {/* Photo strip */}
                    {records.filter((r) => r.clockInPhotoUrl).length > 0 && (
                      <div className="px-5 pb-5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                          Clock-In Photos
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-1">
                          {records
                            .filter((r) => r.clockInPhotoUrl)
                            .map((r) => (
                              <button
                                key={r.id}
                                onClick={() =>
                                  setPhotoModal({
                                    src:  r.clockInPhotoUrl!,
                                    name: `${r.employee.firstName} ${r.employee.lastName} — ${fmtTime(r.clockIn)}`,
                                  })
                                }
                                className="relative shrink-0 group"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={r.clockInPhotoUrl!}
                                  alt={r.employee.firstName}
                                  className="h-20 w-20 object-cover rounded-xl border-2 border-white shadow group-hover:shadow-lg transition-shadow"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center">
                                  <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1 text-center max-w-[80px] truncate">
                                  {r.employee.firstName}
                                </p>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══ LIST VIEW ═════════════════════════════════════════ */}
            {view === "list" && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <th className="px-5 py-3 text-left">Employee</th>
                      <th className="px-5 py-3 text-left">Department</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3 text-center">Clock In</th>
                      <th className="px-5 py-3 text-center">Clock Out</th>
                      <th className="px-5 py-3 text-center">Photo</th>
                      <th className="px-5 py-3 text-center">GPS</th>
                      <th className="px-5 py-3 text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                          No attendance records for this date
                        </td>
                      </tr>
                    ) : (
                      records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3">
                            <p className="font-medium text-slate-800">
                              {r.employee.lastName}, {r.employee.firstName}
                            </p>
                            <p className="text-xs text-slate-400">
                              {r.employee.employeeNumber} · {r.employee.position}
                            </p>
                          </td>
                          <td className="px-5 py-3 text-slate-500 text-xs">{r.employee.department ?? "—"}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status] ?? "bg-slate-100 text-slate-500"}`}>
                              {STATUS_ICON[r.status]}
                              {r.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center font-mono text-xs">{fmtTime(r.clockIn)}</td>
                          <td className="px-5 py-3 text-center font-mono text-xs">{fmtTime(r.clockOut)}</td>
                          <td className="px-5 py-3 text-center">
                            {r.clockInPhotoUrl ? (
                              <button
                                onClick={() => setPhotoModal({
                                  src:  r.clockInPhotoUrl!,
                                  name: `${r.employee.firstName} ${r.employee.lastName} — ${fmtTime(r.clockIn)}`,
                                })}
                                className="mx-auto group relative"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={r.clockInPhotoUrl}
                                  alt="Clock-in photo"
                                  className="h-9 w-9 rounded-lg object-cover border border-slate-200 group-hover:border-indigo-400 transition-colors"
                                />
                                <Camera className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-indigo-500 bg-white rounded-full" />
                              </button>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center">
                            {r.clockInLatitude != null ? (
                              <span
                                title={`${r.clockInLatitude.toFixed(5)}, ${r.clockInLongitude?.toFixed(5)}`}
                                className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"
                              >
                                <MapPin className="h-3 w-3" />GPS
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-700">
                            {r.hoursWorked ? `${Number(r.hoursWorked).toFixed(1)}h` : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
