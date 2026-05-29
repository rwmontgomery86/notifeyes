"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 5_000;

/**
 * Keeps the in-app inbox / unread badges current without a manual reload.
 *
 * The actual rendering is server-side (the layout computes unread counts), so
 * here we just decide *when* to `router.refresh()` and let the server payload
 * update the badges and inbox.
 *
 * Two triggers:
 *   1. Polling fallback (primary in prod). We poll a cheap unread-count probe
 *      every few seconds while the tab is visible and refresh only when the
 *      total rises. This is robust regardless of whether Postgres NOTIFY makes
 *      it to the SSE relay — it doesn't through the Supabase pooler, which is
 *      why the live alert was silently never arriving.
 *   2. SSE fast-path (instant where it works: local dev / a future direct DB
 *      connection). A `notification` event just triggers an immediate poll, so
 *      the same "refresh only on a real increase" logic applies and we don't
 *      double-refresh.
 */
export function NotificationsLive() {
  const router = useRouter();
  // Last unread total we've reconciled the UI against. null = not yet primed.
  const lastTotal = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    async function poll() {
      if (cancelled || document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/notifications/unread-count", {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const { total } = (await res.json()) as { total: number };
        if (cancelled || typeof total !== "number") return;

        // First reading just primes the baseline — the page was server-rendered
        // with the current count moments ago, so there's nothing new to show.
        if (lastTotal.current === null) {
          lastTotal.current = total;
          return;
        }
        if (total > lastTotal.current) {
          lastTotal.current = total;
          router.refresh();
        } else {
          // Count went down (read/dismissed) or held — keep the baseline honest
          // so the next increase is detected correctly.
          lastTotal.current = total;
        }
      } catch {
        // Network blip — try again on the next tick.
      }
    }

    // SSE fast-path: a live notification event just kicks an immediate poll.
    const src = new EventSource("/api/notifications/stream");
    src.addEventListener("notification", () => {
      void poll();
    });
    src.onerror = () => {
      // Browser auto-reconnects; polling covers any gap regardless.
    };

    const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Prime the baseline immediately on mount.
    void poll();

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      src.close();
    };
  }, [router]);

  return null;
}
