"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import {
  MapPin, Camera, Clock, CheckCircle2, XCircle, Loader2,
  AlertCircle, LogOut, RefreshCw, ShieldCheck, ShieldX,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const user = session?.user as { name?: string } | undefined;

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [geofence, setGeofence]       = useState<GeofenceConfig | null>(null);
  const [todayLog, setTodayLog]       = useState<TodayLog | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [gpsState, setGpsState]       = useState<GpsState>("idle");
  const [coords, setCoords]           = useState<{ lat: number; lng: number } | null>(null);
  const [inZone, setInZone]           = useState<boolean | null>(null);
  const [distance, setDistance]       = useState<number | null>(null);

  const [cameraOn, setCameraOn]       = useState(false);
  const [photoUrl, setPhotoUrl]       = useState<string | null>(null);

  const [submitting, setSubmitting]   = useState(false);
  const [message, setMessage]         = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const readyToSubmit = coords !== null && photoUrl !== null && inZone !== false;

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Attendance</h1>
            <p className="text-sm text-gray-500">{user?.name} · {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/employee/login" })}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        {/* Today's status card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Today's Record</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Clock In</p>
              <p className="text-lg font-semibold text-gray-900">{fmt(todayLog?.clockIn ?? null)}</p>
              {todayLog?.clockInLatitude && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />{todayLog.clockInLatitude.toFixed(4)}, {todayLog.clockInLongitude?.toFixed(4)}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400">Clock Out</p>
              <p className="text-lg font-semibold text-gray-900">{fmt(todayLog?.clockOut ?? null)}</p>
              {todayLog?.clockOutLatitude && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />{todayLog.clockOutLatitude.toFixed(4)}, {todayLog.clockOutLongitude?.toFixed(4)}
                </p>
              )}
            </div>
          </div>
          {todayLog?.status && (
            <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              todayLog.status === "PRESENT" ? "bg-green-50 text-green-700" :
              todayLog.status === "LATE"    ? "bg-yellow-50 text-yellow-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {todayLog.status === "PRESENT" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {todayLog.status}
            </div>
          )}
        </div>

        {/* Geofence status */}
        {geofence?.officeLatitude && (
          <div className={`rounded-xl border p-4 flex items-start gap-3 ${
            inZone === null  ? "bg-gray-50 border-gray-200" :
            inZone           ? "bg-green-50 border-green-200" :
                               "bg-red-50 border-red-200"
          }`}>
            {inZone === null  ? <MapPin className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" /> :
             inZone           ? <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 shrink-0" /> :
                                <ShieldX className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />}
            <div>
              <p className={`text-sm font-medium ${inZone === null ? "text-gray-600" : inZone ? "text-green-700" : "text-red-700"}`}>
                {inZone === null ? "Location not verified yet" :
                 inZone         ? `Within office zone (${distance}m away)` :
                                  `Outside office zone (${distance}m away — limit ${geofence.geofenceRadiusMeters}m)`}
              </p>
              {geofence.officeAddress && (
                <p className="text-xs text-gray-500 mt-0.5">{geofence.officeAddress}</p>
              )}
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {message.type === "success"
              ? <CheckCircle2 className="h-4 w-4 shrink-0" />
              : <AlertCircle className="h-4 w-4 shrink-0" />}
            {message.text}
          </div>
        )}

        {allDone ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Attendance complete for today</p>
            <p className="text-sm text-gray-500 mt-1">See you tomorrow!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-medium text-gray-900">
              {canClockIn ? "Clock In" : "Clock Out"}
            </h2>

            {/* Step 1: GPS */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Step 1 — Verify Location
              </p>
              {gpsState === "granted" && coords ? (
                <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-green-700">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </span>
                  <button
                    onClick={() => { setCoords(null); setGpsState("idle"); setInZone(null); }}
                    className="text-green-600 hover:text-green-800"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={requestGps}
                  disabled={gpsState === "loading"}
                >
                  {gpsState === "loading" ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Getting location…</>
                  ) : (
                    <><MapPin className="h-4 w-4 mr-2" />Get My Location</>
                  )}
                </Button>
              )}
            </div>

            {/* Step 2: Photo */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Camera className="h-3.5 w-3.5" /> Step 2 — Take Photo
              </p>
              {photoUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt="Captured" className="w-full rounded-lg object-cover max-h-48" />
                  <button
                    onClick={() => { setPhotoUrl(null); startCamera(); }}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1.5 text-gray-600"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              ) : cameraOn ? (
                <div className="space-y-2">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black" />
                  <Button className="w-full" onClick={capturePhoto}>
                    <Camera className="h-4 w-4 mr-2" />Capture
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={startCamera}>
                  <Camera className="h-4 w-4 mr-2" />Open Camera
                </Button>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Submit */}
            <Button
              className={`w-full ${canClockIn ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}`}
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
                {!coords ? "Get your location first" : !photoUrl ? "Take a photo first" : `You are outside the office geofence`}
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center">
          <a href="/employee/leave" className="text-sm text-blue-600 hover:underline">
            Leave Requests →
          </a>
        </div>
      </div>
    </div>
  );
}
