/**
 * Geocoder — converts a free-form address to lat/lng.
 *
 * V1: Nominatim (OpenStreetMap). Free, no token, but rate-limited to 1 req/sec
 * and requires a meaningful User-Agent per their usage policy:
 *   https://operations.osmfoundation.org/policies/nominatim/
 *
 * For production with real volume, swap to Mapbox / Google / Smarty by
 * implementing the `Geocoder` interface below — `signupPractice` and
 * `updatePracticeSettings` both call the exported `geocoder` singleton.
 */

import "server-only";

export interface GeocodeInput {
  addressLine: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  source: string;
  raw?: unknown;
}

export interface Geocoder {
  geocode(input: GeocodeInput): Promise<GeocodeResult | null>;
}

const USER_AGENT = "NotifEyes/0.1 (dev) admin@notifeyes.local";

/**
 * Last call timestamp for naive rate-limiting. Single-process only; if you
 * scale the API beyond one node, replace with a Redis-backed token bucket
 * (or just switch providers).
 */
let _lastCallAt = 0;

async function rateLimit(): Promise<void> {
  const elapsed = Date.now() - _lastCallAt;
  if (elapsed < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - elapsed));
  }
  _lastCallAt = Date.now();
}

export const nominatimGeocoder: Geocoder = {
  async geocode(input: GeocodeInput): Promise<GeocodeResult | null> {
    const q = [input.addressLine, input.city, input.state, input.zip]
      .filter(Boolean)
      .join(", ");
    if (!q.trim()) return null;

    await rateLimit();

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "us");
    url.searchParams.set("addressdetails", "0");

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        // Don't blow up the request if Nominatim is slow — caller decides
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        console.warn(`[geocode] nominatim ${res.status} for "${q}"`);
        return null;
      }
      const rows = (await res.json()) as { lat: string; lon: string }[];
      const first = rows[0];
      if (!first) return null;
      const lat = Number(first.lat);
      const lng = Number(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng, source: "nominatim", raw: first };
    } catch (err) {
      console.warn("[geocode] nominatim failed:", err);
      return null;
    }
  },
};

export const geocoder: Geocoder = nominatimGeocoder;
