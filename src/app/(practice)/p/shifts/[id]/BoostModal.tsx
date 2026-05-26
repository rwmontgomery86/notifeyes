"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatUsd } from "@/lib/format";
import { boostShift } from "./actions";

export function BoostModal({
  shiftId,
  baseRateCentsPerHour,
  currentBumpRateCentsPerHour,
}: {
  shiftId: string;
  baseRateCentsPerHour: number;
  currentBumpRateCentsPerHour: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const baseRate = Math.round(baseRateCentsPerHour / 100);
  const currentBump =
    currentBumpRateCentsPerHour != null
      ? Math.round(currentBumpRateCentsPerHour / 100)
      : null;
  const initialBump = currentBump ?? baseRate + 20;
  const [bumpRate, setBumpRate] = useState<number>(initialBump);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await boostShift(shiftId, { bumpRatePerHour: bumpRate });
      if (!res.ok) {
        setError(res.error ?? "Could not boost");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ne-btn-secondary"
      >
        {currentBump != null ? "Adjust boost" : "Boost"}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="ne-card max-w-sm w-full bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">
              {currentBump != null
                ? "Adjust the boosted rate"
                : "Boost this shift"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Reaches ODs within 25 miles whose watch zones don&apos;t include
              you. The boosted rate replaces the base rate for whoever books.
            </p>
            <p className="mt-2 text-sm">
              Current rate: <strong>{formatUsd(baseRateCentsPerHour)}/hr</strong>
            </p>
            <label className="mt-3 block">
              <span className="ne-label">Boosted rate (USD per hour)</span>
              <input
                type="number"
                value={bumpRate}
                onChange={(e) => setBumpRate(Number(e.target.value) || 0)}
                min={baseRate + 5}
                max={500}
                step={5}
                className="ne-input"
              />
              <span className="mt-1 block text-xs text-muted-foreground">
                Must be at least ${baseRate + 5}/hr.
              </span>
            </label>
            {error ? (
              <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="ne-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending || bumpRate <= baseRate}
                className="ne-btn"
              >
                {pending ? "Boosting…" : "Apply boost"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
