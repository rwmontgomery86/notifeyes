"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signContractAsOd } from "./actions";

export function OdContractSign({
  bookingId,
  contractBody,
}: {
  bookingId: string;
  contractBody: string;
}) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (!agreed) {
      setError("Please confirm you agree to the terms.");
      return;
    }
    startTransition(async () => {
      const res = await signContractAsOd(bookingId);
      if (!res.ok) {
        setError(res.error ?? "Could not sign");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-4 rounded-md border-2 border-primary/40 bg-accent/40 p-4">
      <h3 className="text-sm font-semibold">Sign the engagement</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        The practice has signed. Sign to lock the booking on your side.
      </p>
      <details className="mt-2">
        <summary className="text-xs cursor-pointer">
          Read full terms
        </summary>
        <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded border bg-background p-3 text-xs">
{contractBody}
        </pre>
      </details>
      <label className="mt-3 flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span>I have read and agree to the engagement terms.</span>
      </label>
      {error ? (
        <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !agreed}
          className="ne-btn"
        >
          {pending ? "Signing…" : "Sign agreement"}
        </button>
      </div>
    </div>
  );
}
