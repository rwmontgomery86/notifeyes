"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelBooking } from "./cancel-actions";

export function CancelBooking({
  bookingId,
  notice,
  side,
}: {
  bookingId: string;
  notice: string;
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
          ? "Cancelling notifies the OD and reopens the shift."
          : "Cancelling notifies the practice and reopens the shift."}
      </p>
      <div className="mt-3 rounded border bg-background p-3 text-xs">
        <div className="font-medium">{notice}</div>
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
