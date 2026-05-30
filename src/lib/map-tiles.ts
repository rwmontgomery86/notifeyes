/**
 * Leaflet tile-layer config. Client-safe — do NOT import `server-only` here;
 * this is pulled into "use client" map components.
 *
 * Uses Mapbox raster tiles when `NEXT_PUBLIC_MAPBOX_TOKEN` is set (inlined at
 * build time by Next), otherwise falls back to the free OpenStreetMap tiles so
 * the maps keep working with no token (dev, or before Mapbox is wired up).
 */

// Read directly off process.env — NEXT_PUBLIC_* is inlined into the client
// bundle at build time, so we can't go through the server-only `env` module.
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export type TileConfig = {
  url: string;
  attribution: string;
  maxZoom: number;
  // Mapbox @2x tiles are 512px and need a -1 zoom offset in Leaflet; OSM uses
  // the 256px default (both left undefined).
  tileSize?: number;
  zoomOffset?: number;
};

export function getTileConfig(): TileConfig {
  if (MAPBOX_TOKEN) {
    return {
      url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`,
      attribution:
        '© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      tileSize: 512,
      zoomOffset: -1,
    };
  }
  return {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap",
    maxZoom: 19,
  };
}
