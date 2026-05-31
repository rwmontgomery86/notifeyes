"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const POLL_INTERVAL_MS = 5_000;

// Suppress background refreshes for a short window after any user interaction.
// `router.refresh()` re-fetches the current route's server components, and if it
// lands while a client navigation is in flight it can clobber it — e.g. the
// booking flow's `router.push("/bookings/:id")`, where a refresh re-runs the
// book page and trips its already-booked redirect guard, bouncing the user to
// /p/shifts/:id. A click/keypress means a navigation may be imminent, so we go
// quiet briefly and pick up any new count on the next idle tick.
const INTERACTION_QUIET_MS = 4_000;
const TOAST_TTL_MS = 8_000;

type LatestNotification = { id: string; kind: string; actionUrl: string | null };

// Human-readable toast titles per notification kind. Falls back to a generic
// label for anything unmapped (e.g. message_received never reaches the toast).
const KIND_LABELS: Record<string, string> = {
  watch_match: "New shift match",
  invite_received: "You've been invited to a shift",
  new_applicant: "New applicant",
  booking_confirmed: "Booking confirmed",
  shift_reminder: "Shift reminder",
  attendance_check: "Did the doctor show?",
  cancellation: "Booking cancelled",
  no_show_check: "No-show check",
  payout_sent: "Payout sent",
  review_request: "Leave a review",
  credential_expiring: "Credential expiring soon",
  verification_decided: "Verification update",
};

function labelFor(kind: string): string {
  return KIND_LABELS[kind] ?? "New notification";
}

/**
 * Keeps the in-app inbox / unread badges current without a manual reload, and
 * pops a toast when a brand-new notification arrives.
 *
 * Rendering of badges/inbox is server-side (the layout computes counts), so this
 * decides *when* to `router.refresh()` and surfaces a lightweight toast for new
 * items. Triggers: a polling fallback (primary in prod) and an SSE fast-path
 * (instant where NOTIFY reaches the relay). Both honor the interaction-quiet
 * window so a background refresh can never race a user-initiated navigation.
 */
export function NotificationsLive() {
  const router = useRouter();
  // Last unread total we've reconciled the UI against. null = not yet primed.
  const lastTotal = useRef<number | null>(null);
  // Id of the most-recent unread notification we've already surfaced.
  const lastNotifId = useRef<string | null>(null);
  const lastInteractionAt = useRef(0);
  const [toast, setToast] = useState<{ title: string; href: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const markInteraction = () => {
      lastInteractionAt.current = Date.now();
    };

    function showToast(latest: LatestNotification) {
      setToast({
        title: labelFor(latest.kind),
        href: latest.actionUrl ?? "/notifications",
      });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => {
        if (!cancelled) setToast(null);
      }, TOAST_TTL_MS);
    }

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
        const data = (await res.json()) as {
          total: number;
          latest: LatestNotification | null;
        };
        if (cancelled || typeof data.total !== "number") return;
        const { total, latest } = data;

        // First reading primes the baselines — the page was server-rendered with
        // the current state moments ago, so there's nothing new to surface.
        if (lastTotal.current === null) {
          lastTotal.current = total;
          lastNotifId.current = latest?.id ?? null;
          return;
        }

        const isNewItem = !!latest && latest.id !== lastNotifId.current;
        lastNotifId.current = latest?.id ?? null;

        if (total > lastTotal.current) {
          // Only toast when the rise is a new *notification* (not e.g. a new
          // message, which has its own surface and leaves `latest` unchanged).
          if (isNewItem && latest) showToast(latest);
          lastTotal.current = total;
          router.refresh();
        } else {
          // Count went down (read/dismissed) or held — keep the baseline honest.
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
      if (toastTimer.current) clearTimeout(toastTimer.current);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", markInteraction, true);
      window.removeEventListener("keydown", markInteraction, true);
      src.close();
    };
  }, [router]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 w-full max-w-xs"
    >
      <div className="ne-card flex items-start gap-3 border-primary/30 shadow-lg">
        <div className="flex-1">
          <div className="text-sm font-semibold">{toast.title}</div>
          <Link
            href={toast.href}
            onClick={() => setToast(null)}
            className="mt-1 inline-block text-sm font-medium text-primary underline underline-offset-2"
          >
            View →
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setToast(null)}
          aria-label="Dismiss notification"
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
