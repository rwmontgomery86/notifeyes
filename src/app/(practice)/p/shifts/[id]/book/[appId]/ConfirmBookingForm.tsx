"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmBooking } from "./actions";

export function ConfirmBookingForm({
  applicationId,
  shiftId,
  contractBody,
}: {
  applicationId: string;
  shiftId: string;
  contractBody: string;
}) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!agreed) {
      setError("Please confirm you agree to the engagement terms.");
      return;
    }
    startTransition(async () => {
      const res = await confirmBooking(applicationId, contractBody);
      if (!res.ok) {
        setError(res.error ?? "Could not book");
        return;
      }
      router.push(`/bookings/${res.bookingId}`);
    });
  }

  return (
    <div className="mt-6 ne-card">
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span>
          I have read and agree to the engagement terms above on behalf of the
          practice. {/* --TODO: legal review --- click-through copy */}
        </span>
      </label>

      {error ? (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex justify-end gap-2">
        <a href={`/p/shifts/${shiftId}`} className="ne-btn-secondary">
          Back
        </a>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !agreed}
          className="ne-btn"
        >
          {pending ? "Booking…" : "Confirm and book"}
        </button>
      </div>
    </div>
  );
}
