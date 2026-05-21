"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { backfillGeocodes } from "./actions";

export function GeocodeBackfillButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ resolved: number; skipped: number } | null>(null);

  return (
    <div className="flex items-center gap-3">
      {result ? (
        <span className="text-xs text-muted-foreground">
          Resolved {result.resolved} · skipped {result.skipped}
        </span>
      ) : null}
      <button
        onClick={() =>
          startTransition(async () => {
            const r = await backfillGeocodes();
            setResult(r);
            router.refresh();
          })
        }
        disabled={pending}
        className="ne-btn"
      >
        {pending ? "Running… (1/sec)" : "Run backfill"}
      </button>
    </div>
  );
}
