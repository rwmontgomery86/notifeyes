"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setApplicationStatus } from "./actions";

export function ApplicantActions({
  applicationId,
  shiftId,
  status,
}: {
  applicationId: string;
  shiftId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmingDecline, setConfirmingDecline] = useState(false);

  function move(to: string) {
    startTransition(async () => {
      await setApplicationStatus(applicationId, to);
      router.refresh();
    });
  }

  // Only applied/shortlisted applicants have actions; the rest are terminal.
  if (status !== "applied" && status !== "shortlisted") return null;

  // Decline is a terminal transition (no undo in the state machine), so guard
  // it behind a confirm rather than firing on a single click.
  if (confirmingDecline) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Decline this applicant?</span>
        <button
          onClick={() => move("declined")}
          disabled={pending}
          className="ne-btn-secondary h-8 px-2 text-xs"
        >
          {pending ? "Declining…" : "Yes, decline"}
        </button>
        <button
          onClick={() => setConfirmingDecline(false)}
          disabled={pending}
          className="ne-btn-ghost h-8 px-2 text-xs"
        >
          Keep
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {status === "applied" ? (
        <button
          onClick={() => move("shortlisted")}
          disabled={pending}
          className="ne-btn-secondary h-8 px-2 text-xs"
        >
          Shortlist
        </button>
      ) : null}
      <Link
        href={`/p/shifts/${shiftId}/book/${applicationId}`}
        className="ne-btn h-8 px-2 text-xs"
      >
        Book →
      </Link>
      <button
        onClick={() => setConfirmingDecline(true)}
        disabled={pending}
        className="ne-btn-ghost h-8 px-2 text-xs"
      >
        Decline
      </button>
    </div>
  );
}
