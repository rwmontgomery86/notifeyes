"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { withdrawApplication } from "./actions";

// Statuses an OD can still withdraw from (mirrors the application state machine).
const WITHDRAWABLE = new Set(["applied", "shortlisted", "offered"]);

type Tone = "ok" | "neutral" | "muted";

function copyFor(
  status: string,
  isInvite: boolean,
): { label: string; body: string; tone: Tone } {
  switch (status) {
    case "applied":
      return {
        label: "Application sent",
        body: "The practice has been notified and can book you straight from your profile. We'll email you the moment they respond.",
        tone: "ok",
      };
    case "shortlisted":
      return {
        label: "Shortlisted",
        body: "The practice shortlisted you — a booking may be on the way. We'll email you if they book.",
        tone: "ok",
      };
    case "offered":
      return {
        label: "Offered",
        body: "The practice offered you this shift.",
        tone: "ok",
      };
    case "accepted":
      return {
        label: "Booked",
        body: "You're booked for this shift — find it under your bookings.",
        tone: "ok",
      };
    case "declined":
      return {
        label: isInvite ? "Invitation declined" : "Not selected",
        body: isInvite
          ? "You declined this invitation."
          : "The practice went with someone else this time.",
        tone: "muted",
      };
    case "withdrawn":
      return {
        label: "Withdrawn",
        body: "You withdrew this application.",
        tone: "muted",
      };
    default:
      return { label: status, body: "", tone: "neutral" };
  }
}

const TONE_PILL: Record<Tone, string> = {
  ok: "border-green-500/40 bg-green-100/60 text-green-900",
  neutral: "border-primary/40 bg-accent text-accent-foreground",
  muted: "border-muted-foreground/40 text-muted-foreground",
};

export function ApplicationStatusCard({
  shiftId,
  status,
  source,
}: {
  shiftId: string;
  status: string;
  source: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const canWithdraw = WITHDRAWABLE.has(status);
  const { label, body, tone } = copyFor(status, source === "invite");

  function withdraw() {
    setError(null);
    startTransition(async () => {
      const res = await withdrawApplication(shiftId);
      if (!res.ok) {
        setError(res.error ?? "Could not withdraw");
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div className="ne-card w-full max-w-md text-left">
      <span className={`ne-pill ${TONE_PILL[tone]}`}>{label}</span>
      {body ? <p className="mt-2 text-sm text-muted-foreground">{body}</p> : null}

      {error ? (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {canWithdraw ? (
        confirming ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span>Withdraw this application?</span>
            <button
              onClick={withdraw}
              disabled={pending}
              className="ne-btn-secondary"
            >
              {pending ? "Withdrawing…" : "Yes, withdraw"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="ne-btn-ghost"
            >
              Keep it
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="mt-3 text-sm font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Withdraw application
          </button>
        )
      ) : null}
    </div>
  );
}
