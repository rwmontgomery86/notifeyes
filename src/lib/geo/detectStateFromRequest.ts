import "server-only";
import { headers } from "next/headers";

export type DetectedState = { code: string; name: string };

const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "Washington, D.C.",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

type CacheEntry = { value: DetectedState | null; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000;

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === "::1" || ip === "127.0.0.1" || ip === "localhost") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (ip.startsWith("172.")) {
    const second = Number(ip.split(".")[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

function toDetected(code: string | undefined): DetectedState | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  const name = US_STATE_NAMES[upper];
  if (!name) return null;
  return { code: upper, name };
}

export function resolveStateOverride(raw: string | undefined): DetectedState | null {
  if (!raw) return null;
  return toDetected(raw);
}

export async function detectStateFromRequest(): Promise<DetectedState | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const realIp = h.get("x-real-ip");
  const ip = (forwarded?.split(",")[0]?.trim() || realIp || "").trim();

  const cacheKey = isPrivateIp(ip) ? "__self__" : ip;
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  // ipapi.co: pass IP unless it's private (then they geo-locate the caller).
  const url = isPrivateIp(ip)
    ? "https://ipapi.co/json/"
    : `https://ipapi.co/${encodeURIComponent(ip)}/json/`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "notifeyes/1.0" },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) {
      cache.set(cacheKey, { value: null, expiresAt: Date.now() + TTL_MS });
      return null;
    }
    const data = (await res.json()) as {
      country_code?: string;
      region_code?: string;
    };
    const value =
      data.country_code === "US" ? toDetected(data.region_code) : null;
    cache.set(cacheKey, { value, expiresAt: Date.now() + TTL_MS });
    return value;
  } catch {
    cache.set(cacheKey, { value: null, expiresAt: Date.now() + TTL_MS });
    return null;
  }
}
