"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondToInvite } from "./invite-response-actions";

export function InviteResponse({
  applicationId,
  practiceName,
}: {
  applicationId: string;
  practiceName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go(decision: "accept" | "decline") {
    setError(null);
    if (
      decision === "accept" &&
      !confirm(
        `Accept ${practiceName}'s invitation? A booking is created immediately — you'll sign the engagement on the booking page.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await respondToInvite(applicationId, decision);
      if (!res.ok) {
        setError(res.error ?? "Could not respond");
        return;
      }
      if (decision === "accept" && res.bookingId) {
        router.push(`/bookings/${res.bookingId}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="ne-card max-w-md">
      <h3 className="font-semibold">{practiceName} invited you</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Accepting creates the booking immediately. The practice has pre-signed
        the engagement; you&apos;ll sign on the booking page.
      </p>
      {error ? (
        <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={() => go("decline")}
          disabled={pending}
          className="ne-btn-ghost"
        >
          Decline
        </button>
        <button
          onClick={() => go("accept")}
          disabled={pending}
          className="ne-btn"
        >
          {pending ? "Working…" : "Accept"}
        </button>
      </div>
    </div>
  );
}
