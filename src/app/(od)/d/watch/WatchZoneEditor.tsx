"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { createWatchZone, geocodeZip } from "./actions";

type DrawnShape =
  | { kind: "circle"; centerLat: number; centerLng: number; radiusMeters: number }
  | { kind: "polygon"; points: { lat: number; lng: number }[] };

type Mode = "zip" | "draw";

const SF_BAY_CENTER: [number, number] = [37.7749, -122.4194];
const METERS_PER_MILE = 1609.344;
const DEFAULT_RADIUS_MILES = 25;
const MIN_RADIUS_MILES = 1;
const MAX_RADIUS_MILES = 100;
const DEFAULT_ZOOM = 7;
const FALLBACK_ZOOM = 11;

const DAY_LABELS: { value: number; label: string }[] = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];
const SHIFT_TYPE_OPTIONS: { value: "fill_in" | "half_day" | "weekend"; label: string }[] = [
  { value: "fill_in", label: "Fill-in" },
  { value: "half_day", label: "Half-day" },
  { value: "weekend", label: "Weekend" },
];

type Channel = "push" | "email" | "sms";

export function WatchZoneEditor({
  initialCenter,
  disabled = false,
  smsOptInEnabled = false,
}: {
  initialCenter?: [number, number];
  disabled?: boolean;
  smsOptInEnabled?: boolean;
} = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<unknown>(null);
  const drawnLayerRef = useRef<unknown>(null);
  const drawControlRef = useRef<unknown>(null);
  const zipCircleRef = useRef<unknown>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  const [mode, setMode] = useState<Mode>("zip");
  const modeRef = useRef<Mode>("zip");
  const [drawn, setDrawn] = useState<DrawnShape | null>(null);
  const [name, setName] = useState("My zone");
  const [minRate, setMinRate] = useState(100);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [timeStart, setTimeStart] = useState<string>("");
  const [timeEnd, setTimeEnd] = useState<string>("");
  const [shiftTypes, setShiftTypes] = useState<("fill_in" | "half_day" | "weekend")[]>([
    "fill_in",
    "half_day",
    "weekend",
  ]);
  const [notifyChannels, setNotifyChannels] = useState<Channel[]>(["push", "email"]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }
  function toggleShiftType(t: "fill_in" | "half_day" | "weekend") {
    setShiftTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }
  function toggleChannel(c: Channel) {
    setNotifyChannels((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  // ZIP-mode state
  const [zip, setZip] = useState("");
  const [zipPending, startZipTransition] = useTransition();
  const [zipError, setZipError] = useState<string | null>(null);
  const [zipCenter, setZipCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusMiles, setRadiusMiles] = useState(DEFAULT_RADIUS_MILES);

  const router = useRouter();

  // Init Leaflet
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet-draw");
      leafletRef.current = L;

      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (cancelled || !containerRef.current) return;

      const center = initialCenter ?? SF_BAY_CENTER;
      const zoom = initialCenter ? DEFAULT_ZOOM : FALLBACK_ZOOM;
      const map = L.map(containerRef.current).setView(center, zoom);
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
      drawControlRef.current = drawControl;
      // Don't add the draw control yet; the mode-toggle effect handles it.

      map.on("draw:created", (e: unknown) => {
        if (modeRef.current !== "draw") return;
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

      map.on("draw:deleted", () => {
        if (modeRef.current === "draw") setDrawn(null);
      });

      // Apply initial mode (zip) now that the map is ready
      applyMode("zip");
    })();
    return () => {
      cancelled = true;
      const m = mapInstance.current as { remove?: () => void } | null;
      m?.remove?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-apply leaflet state whenever the mode toggles
  useEffect(() => {
    modeRef.current = mode;
    if (mapInstance.current) applyMode(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Re-render the ZIP circle whenever the center or radius changes
  useEffect(() => {
    if (mode !== "zip") return;
    if (!zipCenter) return;
    drawZipCircle(zipCenter, radiusMiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipCenter, radiusMiles, mode]);

  function applyMode(next: Mode) {
    const L = leafletRef.current;
    const map = mapInstance.current as ReturnType<NonNullable<typeof L>["map"]> | null;
    const drawnItems = drawnLayerRef.current as InstanceType<NonNullable<typeof L>["FeatureGroup"]> | null;
    const drawControl = drawControlRef.current as Parameters<NonNullable<typeof map>["addControl"]>[0] | null;
    if (!L || !map || !drawnItems || !drawControl) return;

    // Clear any prior shape state when switching modes
    drawnItems.clearLayers();
    if (zipCircleRef.current) {
      map.removeLayer(
        zipCircleRef.current as Parameters<NonNullable<typeof map>["removeLayer"]>[0],
      );
      zipCircleRef.current = null;
    }
    setDrawn(null);

    if (next === "draw") {
      map.addControl(drawControl);
    } else {
      map.removeControl(
        drawControl as Parameters<NonNullable<typeof map>["removeControl"]>[0],
      );
      if (zipCenter) drawZipCircle(zipCenter, radiusMiles);
    }
  }

  function drawZipCircle(center: { lat: number; lng: number }, miles: number) {
    const L = leafletRef.current;
    const map = mapInstance.current as ReturnType<NonNullable<typeof L>["map"]> | null;
    if (!L || !map) return;
    const radiusMeters = miles * METERS_PER_MILE;

    if (zipCircleRef.current) {
      const c = zipCircleRef.current as ReturnType<NonNullable<typeof L>["circle"]>;
      c.setLatLng([center.lat, center.lng]);
      c.setRadius(radiusMeters);
    } else {
      zipCircleRef.current = L.circle([center.lat, center.lng], {
        radius: radiusMeters,
        color: "#3b82f6",
        weight: 2,
        fillOpacity: 0.15,
      }).addTo(map);
    }

    setDrawn({
      kind: "circle",
      centerLat: center.lat,
      centerLng: center.lng,
      radiusMeters,
    });
  }

  function doZipSearch() {
    setZipError(null);
    startZipTransition(async () => {
      const res = await geocodeZip(zip);
      if (!res.ok) {
        setZipError(res.error);
        return;
      }
      const center = { lat: res.lat, lng: res.lng };
      setZipCenter(center);
      const map = mapInstance.current as { setView?: (c: [number, number], z: number) => void } | null;
      map?.setView?.([res.lat, res.lng], 10);
    });
  }

  function save() {
    setError(null);
    if (!drawn) {
      setError(
        mode === "zip"
          ? "Enter a ZIP code and pick a radius first."
          : "Draw a zone first (circle or polygon).",
      );
      return;
    }
    if (daysOfWeek.length === 0) {
      setError("Pick at least one day of the week.");
      return;
    }
    if (shiftTypes.length === 0) {
      setError("Pick at least one shift type.");
      return;
    }
    if (notifyChannels.length === 0) {
      setError("Pick at least one notification channel.");
      return;
    }
    startTransition(async () => {
      const res = await createWatchZone({
        name,
        minRateCents: Math.round(minRate * 100),
        geometryMeta: drawn,
        daysOfWeek,
        timeStart: timeStart || null,
        timeEnd: timeEnd || null,
        shiftTypes,
        notifyChannels,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save zone");
        return;
      }
      router.refresh();
      setDrawn(null);
      setZip("");
      setZipCenter(null);
      const map = mapInstance.current as { removeLayer?: (l: unknown) => void } | null;
      if (map && zipCircleRef.current) {
        map.removeLayer?.(zipCircleRef.current);
        zipCircleRef.current = null;
      }
    });
  }

  return (
    <div className="flex flex-col">
      {/* Mode toggle */}
      <div className="flex gap-1 border-b p-2 bg-card">
        <button
          type="button"
          onClick={() => setMode("zip")}
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            mode === "zip"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent text-muted-foreground"
          }`}
        >
          Search by ZIP
        </button>
        <button
          type="button"
          onClick={() => setMode("draw")}
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            mode === "draw"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent text-muted-foreground"
          }`}
        >
          Draw on map
        </button>
      </div>

      {/* ZIP controls (only in zip mode) */}
      {mode === "zip" ? (
        <div className="border-b p-3 grid gap-3 sm:grid-cols-[1fr_auto] items-end">
          <label className="block">
            <span className="ne-label">ZIP code</span>
            <div className="flex gap-2">
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    doZipSearch();
                  }
                }}
                inputMode="numeric"
                maxLength={10}
                placeholder="e.g. 94110"
                className="ne-input flex-1"
              />
              <button
                type="button"
                onClick={doZipSearch}
                disabled={zipPending || !zip.trim()}
                className="ne-btn-ghost"
              >
                {zipPending ? "Searching…" : "Go"}
              </button>
            </div>
            {zipError ? (
              <div className="text-destructive text-xs mt-1">{zipError}</div>
            ) : null}
          </label>
          <label className="block">
            <span className="ne-label">Radius: {radiusMiles} mi</span>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min={MIN_RADIUS_MILES}
                max={MAX_RADIUS_MILES}
                step={1}
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(Number(e.target.value))}
                disabled={!zipCenter}
                className="w-40"
              />
              <input
                type="number"
                min={MIN_RADIUS_MILES}
                max={MAX_RADIUS_MILES}
                step={1}
                value={radiusMiles}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n)) return;
                  setRadiusMiles(
                    Math.min(MAX_RADIUS_MILES, Math.max(MIN_RADIUS_MILES, Math.round(n))),
                  );
                }}
                disabled={!zipCenter}
                className="ne-input w-20"
              />
            </div>
          </label>
        </div>
      ) : null}

      {/* Map */}
      <div ref={containerRef} className="h-[420px]" />

      {/* Save form */}
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
          {drawn
            ? drawn.kind === "circle"
              ? `circle · ${(drawn.radiusMeters / METERS_PER_MILE).toFixed(1)} mi`
              : `polygon · ${drawn.points.length} points`
            : mode === "zip"
              ? "Enter a ZIP, then set radius"
              : "Draw a circle or polygon"}
        </div>
        <button
          onClick={save}
          disabled={!drawn || pending || disabled}
          title={disabled ? "Enable a notification channel in your profile first." : undefined}
          className="ne-btn"
        >
          {pending ? "Saving…" : "Save zone"}
        </button>
      </div>

      {/* Filters */}
      <div className="border-t p-3 grid gap-4">
        <div>
          <span className="ne-label">Days of week</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {DAY_LABELS.map((d) => {
              const on = daysOfWeek.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={`ne-pill border ${on ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <label className="block">
            <span className="ne-label">Earliest start (optional)</span>
            <input
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              className="ne-input"
            />
          </label>
          <label className="block">
            <span className="ne-label">Latest end (optional)</span>
            <input
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              className="ne-input"
            />
          </label>
        </div>
        <div>
          <span className="ne-label">Shift types</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {SHIFT_TYPE_OPTIONS.map((t) => {
              const on = shiftTypes.includes(t.value);
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => toggleShiftType(t.value)}
                  className={`ne-pill border ${on ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <span className="ne-label">Notify me via</span>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifyChannels.includes("push")}
                onChange={() => toggleChannel("push")}
              />
              <span>Push</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifyChannels.includes("email")}
                onChange={() => toggleChannel("email")}
              />
              <span>Email</span>
            </label>
            <label
              className="flex items-center gap-2"
              title={smsOptInEnabled ? undefined : "Enable SMS in your profile to use this channel."}
            >
              <input
                type="checkbox"
                checked={notifyChannels.includes("sms")}
                disabled={!smsOptInEnabled}
                onChange={() => toggleChannel("sms")}
              />
              <span className={smsOptInEnabled ? undefined : "text-muted-foreground"}>
                SMS{smsOptInEnabled ? null : " (opt in via profile)"}
              </span>
            </label>
          </div>
        </div>
      </div>

      {error ? (
        <div className="border-t bg-destructive/5 text-destructive text-sm px-3 py-2">
          {error}
        </div>
      ) : null}
    </div>
  );
}
