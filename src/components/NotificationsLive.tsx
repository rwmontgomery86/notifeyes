"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Opens the SSE stream and refreshes the page whenever a notification event
 * arrives. The actual rendering is server-side so the inbox stays accurate
 * across the watch alert ➜ inbox path without bespoke client state.
 */
export function NotificationsLive() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const src = new EventSource("/api/notifications/stream");
    src.addEventListener("notification", () => {
      router.refresh();
    });
    src.onerror = () => {
      // Browser will auto-reconnect; nothing else to do
    };
    return () => src.close();
  }, [router]);
  return null;
}
