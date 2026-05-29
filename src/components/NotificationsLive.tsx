"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 5_000;

// Suppress background refreshes for a short window after any user interaction.
// `router.refresh()` re-fetches the current route's server components, and if it
// lands while a client navigation is in flight it can clobber it — e.g. the
// booking flow's `router.push("/bookings/:id")`, where a refresh re-runs the
// book page and trips its already-booked redirect guard, bouncing the user to
// /p/shifts/:id. A click/keypress means a navigation may be imminent, so we go
// quiet briefly and pick up any new count on the next idle tick.
const INTERACTION_QUIET_MS = 4_000;

/**
 * Keeps the in-app inbox / unread badges current without a manual reload.
 *
 * Rendering is server-side (the layout computes unread counts), so this only
 * decides *when* to `router.refresh()` and lets the server payload update the
 * badges and inbox.
 *
 * Two triggers:
 *   1. Polling fallback (primary in prod). Poll a cheap unread-count probe
 *      every few seconds while the tab is visible and refresh only when the
 *      total rises. Robust regardless of whether Postgres NOTIFY reaches the
 *      SSE relay — it doesn't through the Supabase pooler, which is why the
 *      live alert was silently never arriving.
 *   2. SSE fast-path (instant where it works: local dev / a future direct DB
 *      connection). A `notification` event just triggers an immediate poll, so
 *      the same "refresh only on a real increase" logic applies.
 *
 * Both triggers honor the interaction-quiet window so a background refresh can
 * never race a user-initiated navigation.
 */
export function NotificationsLive() {
  const router = useRouter();
  // Last unread total we've reconciled the UI against. null = not yet primed.
  const lastTotal = useRef<number | null>(null);
  // Timestamp of the most recent user interaction (browser clock; client-only).
  const lastInteractionAt = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const markInteraction = () => {
      lastInteractionAt.current = Date.now();
    };

    async function poll() {
      if (cancelled || document.visibilityState !== "visible") return;
      // A navigation may be in flight right after a click/keypress — stay quiet
      // and reconcile on the next idle tick rather than risk clobbering it.
      if (Date.now() - lastInteractionAt.current < INTERACTION_QUIET_MS) return;
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
    // Capture phase so we record the interaction before the click's handlers
    // (and any navigation they trigger) run.
    window.addEventListener("pointerdown", markInteraction, true);
    window.addEventListener("keydown", markInteraction, true);

    // Prime the baseline immediately on mount.
    void poll();

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", markInteraction, true);
      window.removeEventListener("keydown", markInteraction, true);
      src.close();
    };
  }, [router]);

  return null;
}
