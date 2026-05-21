"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyToShift } from "./actions";

export function ApplyButton({ shiftId, verified }: { shiftId: string; verified: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!verified) {
    return (
      <div className="text-right">
        <button disabled className="ne-btn">
          Apply
        </button>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
          Your license is pending verification. Applying unlocks once an admin
          approves your credentials.
        </p>
      </div>
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await applyToShift(shiftId, message);
      if (!res.ok) {
        setError(res.error ?? "Could not apply");
        return;
      }
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="ne-btn">
        Apply
      </button>
    );
  }

  return (
    <div className="ne-card w-full max-w-md text-left">
      <h3 className="font-semibold">Apply to this shift</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Add a quick note (optional). The practice will see your full profile.
      </p>
      <textarea
        rows={4}
        className="ne-input mt-3 h-auto"
        placeholder="Hi! I'm available and have 3 years of fill-in experience…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={1000}
      />
      {error ? (
        <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={() => setOpen(false)}
          disabled={pending}
          className="ne-btn-secondary"
        >
          Cancel
        </button>
        <button onClick={submit} disabled={pending} className="ne-btn">
          {pending ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </div>
  );
}
