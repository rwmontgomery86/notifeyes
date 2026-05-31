"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmAttendance } from "./attendance-actions";

export function ConfirmAttendance({
  bookingId,
  odName,
}: {
  bookingId: string;
  odName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await confirmAttendance(bookingId);
      if (!res.ok) {
        setError(res.error ?? "Could not confirm attendance.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Confirm {odName} showed up for the shift. This captures your $10 match fee.
        You pay {odName}&apos;s wage directly. If they didn&apos;t show, report a
        no-show instead — you won&apos;t be charged.
      </p>

      {error ? (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={confirm}
        disabled={pending}
        className="ne-btn mt-3"
      >
        {pending ? "Confirming…" : `Yes, ${odName} showed up`}
      </button>
    </div>
  );
}
