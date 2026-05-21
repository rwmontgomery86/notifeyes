"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import { formatUsd } from "@/lib/format";

type Pin = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  rateCents: number;
  city: string;
  whenLabel: string;
};

export function ShiftsMap({
  pins,
  home,
}: {
  pins: Pin[];
  home: { lat: number; lng: number } | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      // Fix the default icon paths so Leaflet can find the marker images
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (cancelled || !containerRef.current) return;

      // Center on first pin, or on home, or fall back to SF Bay
      const center: [number, number] =
        pins[0]
          ? [pins[0].lat, pins[0].lng]
          : home
            ? [home.lat, home.lng]
            : [37.7749, -122.4194];

      const map = L.map(containerRef.current).setView(center, 10);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // Home marker — different style (a small circle, not a pin)
      if (home) {
        L.circleMarker([home.lat, home.lng], {
          radius: 7,
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.6,
        })
          .addTo(map)
          .bindTooltip("Home", { permanent: false });
      }

      // Shift pins — clicking opens the shift detail page
      const bounds = L.latLngBounds([]);
      if (home) bounds.extend([home.lat, home.lng]);

      for (const p of pins) {
        const m = L.marker([p.lat, p.lng]).addTo(map);
        m.bindPopup(
          `<div style="font-family:inherit">
            <div style="font-weight:600">${escapeHtml(p.label)}</div>
            <div style="font-size:12px;color:#666">${escapeHtml(p.city)}</div>
            <div style="margin-top:4px">${escapeHtml(p.whenLabel)}</div>
            <div style="font-weight:600;margin-top:2px">${formatUsd(p.rateCents)}/hr</div>
            <div style="margin-top:6px">
              <a href="/shifts/${p.id}" style="color:#2563eb;text-decoration:underline;font-size:12px">View shift →</a>
            </div>
          </div>`,
        );
        m.on("click", () => {
          // Click goes to popup; double-click navigates straight through
        });
        m.on("dblclick", () => {
          router.push(`/shifts/${p.id}`);
        });
        bounds.extend([p.lat, p.lng]);
      }

      // Fit bounds if we have any pins
      if (bounds.isValid() && pins.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }

      // Belt-and-suspenders: if the container was 0px tall when Leaflet
      // initialized (race with the parent's h-[520px] applying), this
      // resizes once layout has settled.
      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    })();

    return () => {
      cancelled = true;
      const m = mapRef.current as { remove?: () => void } | null;
      m?.remove?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Explicit pixel height to avoid the classic Leaflet "container is 0px"
  // race during hydration. The parent card sizes it identically.
  return <div ref={containerRef} style={{ height: 520, width: "100%" }} />;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
