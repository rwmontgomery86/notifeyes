"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatUsd } from "@/lib/format";
import { cancelShift } from "./cancel-actions";

type Status = "draft" | "posted" | "booked" | "completed" | "cancelled";

export function CancelShift({
  shiftId,
  status,
  feePreview,
}: {
  shiftId: string;
  status: Status;
  feePreview?: { feeCents: number; copy: string } | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status === "completed" || status === "cancelled") return null;

  const isDraft = status === "draft";
  const isBooked = status === "booked";
  const buttonLabel = isDraft ? "Delete draft" : "Cancel shift";

  function submit() {
    setError(null);
    if (!isDraft && !reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    startTransition(async () => {
      const res = await cancelShift(shiftId, isDraft ? "" : reason.trim());
      if (!res.ok) {
        setError(res.error ?? "Could not cancel");
        return;
      }
      router.push(
        isDraft ? "/p/shifts?status=draft" : "/p/shifts?status=cancelled",
      );
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ne-btn-ghost text-destructive"
      >
        {buttonLabel}
      </button>
    );
  }

  return (
    <div className="mt-4 w-full rounded-md border-2 border-destructive/40 bg-destructive/5 p-4">
      <h3 className="font-semibold">
        {isDraft ? "Delete this draft?" : "Cancel this shift?"}
      </h3>
      <p className="mt-1 text-sm">
        {isDraft
          ? "Drafts are removed entirely. This can't be undone."
          : isBooked
            ? "Cancelling notifies the OD on the booking and may incur a fee per the schedule below."
            : "Cancelling notifies everyone who applied and marks their applications declined."}
      </p>

      {isBooked && feePreview ? (
        <div className="mt-3 rounded border bg-background p-3 text-xs">
          <div className="font-medium">{feePreview.copy}</div>
          {feePreview.feeCents > 0 ? (
            <div className="mt-1">
              Estimated fee: {formatUsd(feePreview.feeCents)}
            </div>
          ) : null}
          <div className="mt-1 text-muted-foreground">
            See full cancellation policy in the engagement agreement.
          </div>
        </div>
      ) : null}

      {!isDraft ? (
        <label className="mt-3 block">
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
      ) : null}

      {error ? (
        <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={pending}
          className="ne-btn-secondary"
        >
          {isDraft ? "Keep draft" : "Keep shift"}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="ne-btn bg-destructive hover:bg-destructive/90"
        >
          {pending
            ? isDraft
              ? "Deleting…"
              : "Cancelling…"
            : isDraft
              ? "Delete draft"
              : "Confirm cancel"}
        </button>
      </div>
    </div>
  );
}
