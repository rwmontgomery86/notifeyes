"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { createWatchZone } from "./actions";

type DrawnShape =
  | { kind: "circle"; centerLat: number; centerLng: number; radiusMeters: number }
  | { kind: "polygon"; points: { lat: number; lng: number }[] };

const SF_BAY_CENTER: [number, number] = [37.7749, -122.4194];

export function WatchZoneEditor() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<unknown>(null);
  const drawnLayerRef = useRef<unknown>(null);
  const [drawn, setDrawn] = useState<DrawnShape | null>(null);
  const [name, setName] = useState("My zone");
  const [minRate, setMinRate] = useState(100);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Leaflet must only run client-side
      const L = (await import("leaflet")).default;
      await import("leaflet-draw");

      // Fix default marker icon paths (leaflet expects images next to its CSS;
      // npm install doesn't put them on a known URL)
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

      const map = L.map(containerRef.current).setView(SF_BAY_CENTER, 11);
      mapInstance.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const drawnItems = new L.FeatureGroup();
      drawnLayerRef.current = drawnItems;
      map.addLayer(drawnItems);

      const drawControl = new (L.Control as unknown as {
        Draw: new (opts: Record<string, unknown>) => unknown;
      }).Draw({
        edit: { featureGroup: drawnItems, remove: true },
        draw: {
          polyline: false,
          marker: false,
          circlemarker: false,
          rectangle: false,
          polygon: { allowIntersection: false, showArea: false },
          circle: { shapeOptions: { color: "#3b82f6" } },
        },
      }) as Parameters<typeof map.addControl>[0];
      map.addControl(drawControl);

      map.on("draw:created", (e: unknown) => {
        const event = e as {
          layerType: "circle" | "polygon";
          layer: {
            getLatLng?: () => { lat: number; lng: number };
            getRadius?: () => number;
            getLatLngs?: () => { lat: number; lng: number }[][];
          };
        };
        drawnItems.clearLayers();
        drawnItems.addLayer(event.layer as never);
        if (event.layerType === "circle" && event.layer.getLatLng && event.layer.getRadius) {
          const c = event.layer.getLatLng();
          setDrawn({
            kind: "circle",
            centerLat: c.lat,
            centerLng: c.lng,
            radiusMeters: event.layer.getRadius(),
          });
        } else if (event.layerType === "polygon" && event.layer.getLatLngs) {
          const latlngs = event.layer.getLatLngs()[0] ?? [];
          setDrawn({
            kind: "polygon",
            points: latlngs.map((p) => ({ lat: p.lat, lng: p.lng })),
          });
        }
      });

      map.on("draw:deleted", () => setDrawn(null));
    })();
    return () => {
      cancelled = true;
      const m = mapInstance.current as { remove?: () => void } | null;
      m?.remove?.();
    };
  }, []);

  function save() {
    setError(null);
    if (!drawn) {
      setError("Draw a zone first (circle or polygon).");
      return;
    }
    startTransition(async () => {
      const res = await createWatchZone({
        name,
        minRateCents: Math.round(minRate * 100),
        geometryMeta: drawn,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save zone");
        return;
      }
      router.refresh();
      setDrawn(null);
    });
  }

  return (
    <div className="flex flex-col h-[520px]">
      <div ref={containerRef} className="flex-1 min-h-0" />
      <div className="border-t p-3 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] items-end">
        <label className="block">
          <span className="ne-label">Zone name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="ne-input"
            maxLength={100}
          />
        </label>
        <label className="block">
          <span className="ne-label">Min rate ($/hr)</span>
          <input
            type="number"
            min={20}
            max={500}
            step={5}
            value={minRate}
            onChange={(e) => setMinRate(Number(e.target.value))}
            className="ne-input w-32"
          />
        </label>
        <div className="text-xs text-muted-foreground self-center max-w-32">
          {drawn ? `${drawn.kind} ready` : "Draw a circle or polygon"}
        </div>
        <button
          onClick={save}
          disabled={!drawn || pending}
          className="ne-btn"
        >
          {pending ? "Saving…" : "Save zone"}
        </button>
      </div>
      {error ? (
        <div className="border-t bg-destructive/5 text-destructive text-sm px-3 py-2">
          {error}
        </div>
      ) : null}
    </div>
  );
}
