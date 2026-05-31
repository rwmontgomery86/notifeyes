"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBayAreaWatchZone } from "./actions";

// One-tap "Watch the Bay Area" for brand-new ODs — skips the draw/ZIP step so
// alerts start flowing immediately. Shown only until the OD has a zone.
export function BayAreaQuickStart({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await createBayAreaWatchZone();
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="ne-card border-primary/30 bg-primary/5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">New here? Watch the whole Bay Area.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One tap creates a watch zone over the SF Bay metro — the city, the
            Peninsula, the East Bay, and San Jose — so alerts start right away.
            Draw precise zones or fine-tune below anytime.
          </p>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || pending}
          className="ne-btn shrink-0 disabled:opacity-50"
        >
          {pending ? "Setting up…" : "Watch the Bay Area"}
        </button>
      </div>
    </div>
  );
}
