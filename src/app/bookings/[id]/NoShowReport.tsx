"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reportNoShow } from "./noshow-actions";

export function NoShowReport({
  bookingId,
  shiftStartsAt,
}: {
  bookingId: string;
  shiftStartsAt: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const startedAtMs = new Date(shiftStartsAt).getTime();
  const minutesSinceStart = (Date.now() - startedAtMs) / 60_000;
  const ready = minutesSinceStart >= 15;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="ne-btn-ghost text-destructive"
        disabled={!ready}
        title={!ready ? "Report no-show 15+ min after start time" : ""}
      >
        Report no-show
      </button>
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await reportNoShow(bookingId, reason.trim() || null);
      if (!res.ok) {
        setError(res.error ?? "Could not report");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-md border-2 border-destructive/40 bg-destructive/5 p-4 max-w-md">
      <h3 className="font-semibold">Report no-show</h3>
      <p className="mt-1 text-sm">
        Confirm the OD didn&apos;t show. You won&apos;t be charged the match fee,
        and it&apos;s recorded on the OD&apos;s reliability record.
      </p>
      <label className="block mt-3">
        <span className="ne-label">Notes (optional)</span>
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          className="ne-input h-auto"
        />
      </label>
      {error ? (
        <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={() => setOpen(false)} disabled={pending} className="ne-btn-secondary">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={pending}
          className="ne-btn bg-destructive hover:bg-destructive/90"
        >
          {pending ? "Reporting…" : "Confirm no-show"}
        </button>
      </div>
    </div>
  );
}
