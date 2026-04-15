"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import {
  MapPin, Camera, Clock, CheckCircle2, XCircle, Loader2,
  AlertCircle, LogOut, RefreshCw, ShieldCheck, ShieldX, Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─ Leaflet map loaded only client-side ─────────────────────────── */
const LeafletMap = dynamic(
  () => import("@/components/shared/LeafletMap").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-slate-100 rounded-xl" style={{ height: 230 }}>
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    ),
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeofenceConfig {
  officeAddress: string | null;
  officeLatitude: number | null;
  officeLongitude: number | null;
  geofenceRadiusMeters: number;
}

interface TodayLog {
  id: string;
  clockIn: string | null;
  clockOut: string | null;
  status: string;
  clockInLatitude: number | null;
  clockInLongitude: number | null;
  clockOutLatitude: number | null;
  clockOutLongitude: number | null;
  clockInPhotoUrl: string | null;
  clockOutPhotoUrl: string | null;
}

type GpsState = "idle" | "loading" | "granted" | "denied";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmployeeAttendancePage() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string; portalRole?: string } | undefined;

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [geofence, setGeofence]       = useState<GeofenceConfig | null>(null);
  const [todayLog, setTodayLog]       = useState<TodayLog | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [gpsState, setGpsState] = useState<GpsState>("idle");
  const [coords,   setCoords]   = useState<{ lat: number; lng: number } | null>(null);
  const [inZone,   setInZone]   = useState<boolean | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [message,    setMessage]    = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Load geofence + today's log ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [geoRes, logRes] = await Promise.all([
        fetch("/api/employee/geofence"),
        fetch("/api/employee/attendance"),
      ]);
      const geoJson = await geoRes.json() as { success: boolean; data: GeofenceConfig };
      const logJson = await logRes.json() as { success: boolean; data: TodayLog | null };
      if (geoJson.success) setGeofence(geoJson.data);
      if (logJson.success) setTodayLog(logJson.data);
    } catch {
      // non-fatal
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── GPS ──────────────────────────────────────────────────────────────────
  function requestGps() {
    setGpsState("loading");
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setGpsState("granted");

        if (geofence?.officeLatitude != null && geofence?.officeLongitude != null) {
          const d = distanceMeters(lat, lng, geofence.officeLatitude, geofence.officeLongitude);
          setDistance(Math.round(d));
          setInZone(d <= geofence.geofenceRadiusMeters);
        } else {
          setInZone(true); // no geofence configured = open
        }
      },
      () => {
        setGpsState("denied");
        setMessage({ type: "error", text: "Location permission denied. Please enable GPS to clock in." });
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  // ── Camera ────────────────────────────────────────────────────────────────
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      setPhotoUrl(null);
    } catch {
      setMessage({ type: "error", text: "Camera access denied. Please allow camera permission." });
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  function capturePhoto() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setPhotoUrl(canvas.toDataURL("image/jpeg", 0.8));
    stopCamera();
  }

  // ── Clock In / Out ────────────────────────────────────────────────────────
  async function handleClock(action: "clock-in" | "clock-out") {
    if (!coords)   { setMessage({ type: "error", text: "GPS location required." }); return; }
    if (!photoUrl) { setMessage({ type: "error", text: "Photo is required." });     return; }
    if (inZone === false) {
      setMessage({ type: "error", text: `You are ${distance}m from the office — outside the ${geofence?.geofenceRadiusMeters}m geofence.` });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/employee/attendance/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng, photoDataUrl: photoUrl }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) {
        setMessage({ type: "error", text: json.error ?? "Failed." });
      } else {
        setMessage({ type: "success", text: action === "clock-in" ? "Clocked in successfully!" : "Clocked out successfully!" });
        setPhotoUrl(null);
        setCoords(null);
        setInZone(null);
        setDistance(null);
        setGpsState("idle");
        await loadData();
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const alreadyClockedIn  = !!todayLog?.clockIn;
  const alreadyClockedOut = !!todayLog?.clockOut;
  const canClockIn        = !alreadyClockedIn;
  const canClockOut       = alreadyClockedIn && !alreadyClockedOut;
  const allDone           = alreadyClockedIn && alreadyClockedOut;
  const readyToSubmit     = coords !== null && photoUrl !== null && inZone !== false;

  const hasOffice = geofence?.officeLatitude != null && geofence?.officeLongitude != null;
  const mapCenter = hasOffice
    ? { lat: geofence!.officeLatitude!, lng: geofence!.officeLongitude! }
    : coords;

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <p className="font-bold text-gray-900 text-sm">{user?.name}</p>
          <p className="text-xs text-gray-400">
            {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/employee/login" })}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />Sign out
        </button>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-10">

        {/* ── Today's status card ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today&apos;s Record</p>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Clock In</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{fmt(todayLog?.clockIn ?? null)}</p>
              {todayLog?.clockInLatitude && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-green-500" />
                  {todayLog.clockInLatitude.toFixed(4)}, {todayLog.clockInLongitude?.toFixed(4)}
                </p>
              )}
              {todayLog?.clockInPhotoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={todayLog.clockInPhotoUrl} alt="Clock-in photo"
                  className="mt-2 h-12 w-12 rounded-lg object-cover border border-gray-200" />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Clock Out</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{fmt(todayLog?.clockOut ?? null)}</p>
              {todayLog?.clockOutLatitude && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-blue-400" />
                  {todayLog.clockOutLatitude.toFixed(4)}, {todayLog.clockOutLongitude?.toFixed(4)}
                </p>
              )}
              {todayLog?.clockOutPhotoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={todayLog.clockOutPhotoUrl} alt="Clock-out photo"
                  className="mt-2 h-12 w-12 rounded-lg object-cover border border-gray-200" />
              )}
            </div>
          </div>
          {todayLog?.status && (
            <div className="px-5 pb-4">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                todayLog.status === "PRESENT" ? "bg-green-100 text-green-700" :
                todayLog.status === "LATE"    ? "bg-amber-100 text-amber-700" :
                                                "bg-gray-100 text-gray-600"
              }`}>
                {todayLog.status === "PRESENT"
                  ? <CheckCircle2 className="h-3 w-3" />
                  : <Clock className="h-3 w-3" />}
                {todayLog.status}
              </span>
            </div>
          )}
        </div>

        {/* ── Message ───────────────────────────────────────────── */}
        {message && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {message.type === "success"
              ? <CheckCircle2 className="h-4 w-4 shrink-0" />
              : <AlertCircle  className="h-4 w-4 shrink-0" />}
            {message.text}
          </div>
        )}

        {/* ── All done ──────────────────────────────────────────── */}
        {allDone ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <p className="font-semibold text-gray-900">Attendance complete for today</p>
            <p className="text-sm text-gray-400 mt-1">See you tomorrow!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Card header */}
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">
                {canClockIn ? "Clock In" : "Clock Out"}
              </p>
              {geofence?.officeAddress && (
                <p className="text-xs text-gray-400 flex items-center gap-1 truncate max-w-[180px]">
                  <MapPin className="h-3 w-3 shrink-0" />{geofence.officeAddress}
                </p>
              )}
            </div>

            <div className="p-5 space-y-5">

              {/* Step 1: GPS */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="inline-flex h-4 w-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] items-center justify-center font-bold shrink-0">1</span>
                  Verify Location
                </p>

                {gpsState === "granted" && coords ? (
                  <div className="space-y-3">
                    {/* Zone status banner */}
                    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                      inZone === false
                        ? "bg-red-50 border border-red-200"
                        : "bg-green-50 border border-green-200"
                    }`}>
                      {inZone === false
                        ? <ShieldX     className="h-5 w-5 text-red-500 shrink-0" />
                        : <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-tight ${inZone === false ? "text-red-700" : "text-green-700"}`}>
                          {inZone === false
                            ? `Outside geofence — ${distance}m away (limit ${geofence?.geofenceRadiusMeters}m)`
                            : inZone
                              ? `Inside office zone${distance != null ? ` — ${distance}m from office` : ""}`
                              : "Location verified"}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                        </p>
                      </div>
                      <button
                        onClick={() => { setCoords(null); setGpsState("idle"); setInZone(null); setDistance(null); }}
                        className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors"
                        title="Re-detect location"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Live map showing office perimeter + user pin */}
                    {mapCenter && (
                      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
                          <Navigation className="h-3.5 w-3.5 text-indigo-500" />
                          <span className="text-xs font-medium text-gray-600">Live Location</span>
                          {hasOffice && geofence?.geofenceRadiusMeters && (
                            <span className="ml-auto text-xs text-gray-400">
                              {geofence.geofenceRadiusMeters}m perimeter
                            </span>
                          )}
                        </div>
                        <LeafletMap
                          key={`${coords.lat.toFixed(5)}-${coords.lng.toFixed(5)}`}
                          center={mapCenter}
                          radiusMeters={geofence?.geofenceRadiusMeters ?? 0}
                          userLocation={coords}
                          inZone={inZone}
                          height="240px"
                          zoom={17}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-11"
                    onClick={requestGps}
                    disabled={gpsState === "loading"}
                  >
                    {gpsState === "loading" ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />Getting location…</>
                    ) : (
                      <><MapPin className="h-4 w-4 mr-2 text-indigo-500" />Get My Location</>
                    )}
                  </Button>
                )}
              </div>

              {/* Step 2: Photo */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="inline-flex h-4 w-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] items-center justify-center font-bold shrink-0">2</span>
                  Take Photo
                </p>
                {photoUrl ? (
                  <div className="relative rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrl} alt="Captured" className="w-full rounded-xl object-cover max-h-52" />
                    <button
                      onClick={() => { setPhotoUrl(null); startCamera(); }}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 text-gray-600 shadow"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/50 rounded-lg px-2 py-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                      <span className="text-white text-xs font-medium">Photo captured</span>
                    </div>
                  </div>
                ) : cameraOn ? (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden bg-black">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl" />
                      {/* Face-guide circle overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-36 h-36 rounded-full border-2 border-white/50 border-dashed" />
                      </div>
                    </div>
                    <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700" onClick={capturePhoto}>
                      <Camera className="h-4 w-4 mr-2" />Capture Photo
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full h-11" onClick={startCamera}>
                    <Camera className="h-4 w-4 mr-2 text-indigo-500" />Open Camera
                  </Button>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Submit */}
              <Button
                className={`w-full h-12 text-sm font-semibold rounded-xl ${
                  canClockIn
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
                disabled={!readyToSubmit || submitting}
                onClick={() => handleClock(canClockIn ? "clock-in" : "clock-out")}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</>
                ) : canClockIn ? (
                  <><CheckCircle2 className="h-4 w-4 mr-2" />Clock In</>
                ) : (
                  <><XCircle className="h-4 w-4 mr-2" />Clock Out</>
                )}
              </Button>

              {!readyToSubmit && (
                <p className="text-xs text-center text-gray-400">
                  {!coords
                    ? "Get your location first"
                    : !photoUrl
                      ? "Take a photo first"
                      : "You are outside the office geofence"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center gap-6 pt-2">
          <a href="/employee/leave" className="text-sm text-indigo-600 hover:underline font-medium">
            Leave Requests →
          </a>
          {user?.portalRole === "DRIVER" && (
            <a href="/employee/fuel-requests" className="text-sm text-indigo-600 hover:underline font-medium">
              Fuel Requests →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
