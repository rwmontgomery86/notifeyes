"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { odCheckIn, odCheckOut } from "./checkinout-actions";

export function CheckInOut({
  bookingId,
  bookingStatus,
  shiftStartsAt,
  shiftEndsAt,
  checkedInAt,
  checkedOutAt,
}: {
  bookingId: string;
  bookingStatus: "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  shiftStartsAt: string;
  shiftEndsAt: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const now = Date.now();
  const startMs = new Date(shiftStartsAt).getTime();
  const endMs = new Date(shiftEndsAt).getTime();
  // Allow check-in any time from 1h before start. Earlier than that, button
  // is visible but disabled — practice and OD know it's coming.
  const checkInAvailable = !checkedInAt && now >= startMs - 60 * 60_000;
  const checkInUpcoming = !checkedInAt && now < startMs - 60 * 60_000;
  const checkOutAvailable = !!checkedInAt && !checkedOutAt;
  // Don't show anything once the booking is done
  if (bookingStatus === "completed" || bookingStatus === "cancelled" || bookingStatus === "no_show") {
    if (checkedInAt || checkedOutAt) {
      return (
        <div className="mt-3 text-xs text-muted-foreground">
          {checkedInAt
            ? `Checked in ${new Date(checkedInAt).toLocaleString()}`
            : null}
          {checkedOutAt
            ? ` · checked out ${new Date(checkedOutAt).toLocaleString()}`
            : null}
        </div>
      );
    }
    return null;
  }

  function go(which: "in" | "out") {
    setError(null);
    startTransition(async () => {
      const res = which === "in"
        ? await odCheckIn(bookingId)
        : await odCheckOut(bookingId);
      if (!res.ok) {
        setError(res.error ?? "Action failed");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {checkedInAt ? (
        <span className="text-xs text-muted-foreground">
          Checked in at {new Date(checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </span>
      ) : null}
      {checkInUpcoming ? (
        <button disabled className="ne-btn-secondary" title="Available 1 hour before start">
          Check in
        </button>
      ) : checkInAvailable ? (
        <button
          onClick={() => go("in")}
          disabled={pending}
          className="ne-btn"
        >
          {pending ? "Checking in…" : "Check in"}
        </button>
      ) : null}
      {checkOutAvailable ? (
        <button
          onClick={() => go("out")}
          disabled={pending}
          className="ne-btn"
        >
          {pending ? "Checking out…" : "Check out"}
        </button>
      ) : null}
      {checkedOutAt ? (
        <span className="text-xs text-muted-foreground">
          Checked out at {new Date(checkedOutAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </span>
      ) : null}
      {checkInUpcoming ? (
        <span className="text-xs text-muted-foreground">
          Check-in opens 1 hour before start.
        </span>
      ) : null}
      {error ? (
        <div className="basis-full mt-1 text-xs text-destructive">{error}</div>
      ) : null}
    </div>
  );
}
