"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelBooking } from "./cancel-actions";
import { formatUsd } from "@/lib/format";

export function CancelBooking({
  bookingId,
  feeCents,
  feeCopy,
  side,
}: {
  bookingId: string;
  feeCents: number;
  feeCopy: string;
  side: "practice" | "od";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    startTransition(async () => {
      const res = await cancelBooking(bookingId, reason.trim());
      if (!res.ok) {
        setError(res.error ?? "Could not cancel");
        return;
      }
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="ne-btn-ghost text-destructive">
        Cancel booking
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-md border-2 border-destructive/40 bg-destructive/5 p-4">
      <h3 className="font-semibold">Cancel this booking?</h3>
      <p className="mt-1 text-sm">
        {side === "practice"
          ? "Cancelling will notify the OD and may incur a fee per the schedule below."
          : "Cancelling will notify the practice. OD-initiated cancellations may incur a fee depending on timing."}
      </p>
      <div className="mt-3 rounded border bg-background p-3 text-xs">
        <div className="font-medium">{feeCopy}</div>
        {feeCents > 0 ? (
          <div className="mt-1">Estimated fee: {formatUsd(feeCents)}</div>
        ) : null}
        <div className="mt-1 text-muted-foreground">
          {/* --TODO: legal review --- show full schedule + ToS link */}
          See full cancellation policy in the engagement agreement.
        </div>
      </div>
      <label className="block mt-3">
        <span className="ne-label">Reason</span>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="ne-input h-auto"
          maxLength={500}
          placeholder="What's going on?"
        />
      </label>
      {error ? (
        <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={() => setOpen(false)} disabled={pending} className="ne-btn-secondary">
          Keep booking
        </button>
        <button
          onClick={submit}
          disabled={pending}
          className="ne-btn bg-destructive hover:bg-destructive/90"
        >
          {pending ? "Cancelling…" : "Confirm cancel"}
        </button>
      </div>
    </div>
  );
}
