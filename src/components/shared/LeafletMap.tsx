"use client";

/**
 * LeafletMap — SSR-safe OpenStreetMap component.
 * Uses dynamic import for Leaflet + injects CSS from CDN.
 * No API key required — tiles served by OSM/OpenStreetMap contributors.
 */

import { useEffect, useRef } from "react";

export interface MapMarker {
  lat: number;
  lng: number;
  /** Display label (popup title) */
  label: string;
  /** Optional sub-text shown in popup (e.g. clock-in time) */
  sublabel?: string;
  /** base64 or URL of employee photo */
  photoUrl?: string | null;
  /** "office" | "employee" | "user" — controls icon style */
  kind?: "office" | "employee" | "user";
}

interface LeafletMapProps {
  /** Map centre (usually office lat/lng) */
  center: { lat: number; lng: number };
  /** Perimeter circle radius in metres; omit / 0 to skip */
  radiusMeters?: number;
  markers?: MapMarker[];
  /** Current user location dot (employee side) */
  userLocation?: { lat: number; lng: number } | null;
  /** Whether user is inside the perimeter (affects circle colour) */
  inZone?: boolean | null;
  height?: string;
  zoom?: number;
}

/* ── SVG/HTML icons ─────────────────────────────────────────────────── */

function officeHtml() {
  return `<div style="
    background: #4f46e5;
    color: white;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    border: 3px solid white;
  ">🏢</div>`;
}

function employeeHtml(photoUrl: string | null | undefined, name: string) {
  if (photoUrl && photoUrl.length > 20) {
    return `<div style="
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      border: 3px solid #10b981;
      box-shadow: 0 2px 8px rgba(0,0,0,0.30);
    "><img src="${photoUrl}" alt="${name}" style="width:100%;height:100%;object-fit:cover;" /></div>`;
  }
  // Initials fallback
  const initials = name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return `<div style="
    background: #10b981;
    color: white;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(0,0,0,0.30);
    border: 3px solid white;
  ">${initials || "👤"}</div>`;
}

function userHtml() {
  return `<div style="
    background: #2563eb;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    border: 3px solid white;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.35);
  "></div>`;
}

/* ── Popup HTML ─────────────────────────────────────────────────────── */

function popupHtml(m: MapMarker) {
  const photo = m.photoUrl && m.photoUrl.length > 20
    ? `<img src="${m.photoUrl}" alt="${m.label}" style="width:140px;margin-top:6px;border-radius:6px;display:block;" />`
    : "";
  return `
    <div style="font-family:system-ui,sans-serif;min-width:120px">
      <strong style="font-size:13px;color:#111">${m.label}</strong>
      ${m.sublabel ? `<div style="font-size:11px;color:#6b7280;margin-top:1px">${m.sublabel}</div>` : ""}
      ${photo}
    </div>`;
}

/* ── Component ──────────────────────────────────────────────────────── */

export function LeafletMap({
  center,
  radiusMeters = 0,
  markers = [],
  userLocation,
  inZone,
  height = "420px",
  zoom = 17,
}: LeafletMapProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<unknown>(null);

  /* Inject Leaflet CSS once */
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!document.getElementById("leaflet-css")) {
      const link  = document.createElement("link");
      link.id     = "leaflet-css";
      link.rel    = "stylesheet";
      link.href   = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;

      /* Fix broken default icon paths in webpack bundled envs */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([center.lat, center.lng], zoom);

      mapRef.current = map;

      /* OpenStreetMap tiles */
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      /* Perimeter circle */
      if (radiusMeters > 0) {
        const circleColor = inZone === false ? "#ef4444" : "#4f46e5";
        L.circle([center.lat, center.lng], {
          radius:      radiusMeters,
          color:       circleColor,
          weight:      2,
          fillColor:   circleColor,
          fillOpacity: 0.08,
          dashArray:   "6 4",
        }).addTo(map);
      }

      /* Office marker (always at centre) */
      const officeIcon = L.divIcon({
        className: "",
        html:      officeHtml(),
        iconSize:  [40, 40],
        iconAnchor:[20, 20],
      });
      L.marker([center.lat, center.lng], { icon: officeIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<strong style="font-family:system-ui;font-size:13px">Office</strong>`);

      /* Employee / custom markers */
      markers.forEach((m) => {
        const html = m.kind === "user"
          ? userHtml()
          : employeeHtml(m.photoUrl, m.label);

        const icon = L.divIcon({
          className:  "",
          html,
          iconSize:   m.kind === "user" ? [18, 18] : [40, 40],
          iconAnchor: m.kind === "user" ? [9, 9]   : [20, 20],
        });

        L.marker([m.lat, m.lng], { icon })
          .addTo(map)
          .bindPopup(popupHtml(m), { maxWidth: 180 });
      });

      /* User location dot */
      if (userLocation) {
        const icon = L.divIcon({
          className: "",
          html:      userHtml(),
          iconSize:  [18, 18],
          iconAnchor:[9, 9],
        });
        L.marker([userLocation.lat, userLocation.lng], { icon, zIndexOffset: 900 })
          .addTo(map)
          .bindPopup(`<strong style="font-family:system-ui;font-size:13px">Your Location</strong>`);

        /* Fit bounds to show both office and user */
        const bounds = L.latLngBounds(
          [center.lat, center.lng],
          [userLocation.lat, userLocation.lng],
        ).pad(0.3);
        map.fitBounds(bounds);
      }
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove();
        mapRef.current = null;
      }
    };
    // We intentionally run this only once on mount — the parent re-keys
    // the component when data changes (key={JSON.stringify(...)})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        height,
        width: "100%",
        borderRadius: "12px",
        overflow: "hidden",
        zIndex: 0,
        position: "relative",
      }}
    />
  );
}
