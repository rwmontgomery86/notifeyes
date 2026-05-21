"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchOds, inviteOds } from "./invite-actions";

type OdHit = {
  id: string;
  name: string;
  displayName: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  shiftsCompleted: number;
  isFavorite: boolean;
};

export function InvitePanel({
  shiftId,
  contractBody,
}: {
  shiftId: string;
  contractBody: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OdHit[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [agreed, setAgreed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const rows = await searchOds(query);
      if (!cancelled) setResults(rows);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, query]);

  function toggle(odId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(odId)) next.delete(odId);
      else next.add(odId);
      return next;
    });
  }

  function submit() {
    setError(null);
    if (selected.size === 0) {
      setError("Pick at least one OD to invite.");
      return;
    }
    if (!agreed) {
      setError("Confirm the engagement terms before inviting.");
      return;
    }
    startTransition(async () => {
      const res = await inviteOds(shiftId, Array.from(selected), contractBody);
      if (!res.ok) {
        setError(res.error ?? "Could not send invites");
        return;
      }
      setOpen(false);
      setSelected(new Set());
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="ne-btn-secondary">
        Invite ODs
      </button>
    );
  }

  return (
    <div className="mt-4 ne-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Invite ODs to this shift</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Invited ODs land on the shift with an Accept button — accept
            auto-creates the booking (you sign now, they sign on the booking
            page).
          </p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="ne-btn-ghost h-8 px-2 text-xs"
          disabled={pending}
        >
          Close
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search verified ODs by name…"
        className="ne-input mt-3"
        autoFocus
      />

      <ul className="mt-3 max-h-64 overflow-y-auto space-y-1">
        {results.length === 0 ? (
          <li className="text-xs text-muted-foreground py-2">
            {query ? "No matches." : "Start typing to search verified ODs."}
          </li>
        ) : null}
        {results.map((od) => {
          const on = selected.has(od.id);
          return (
            <li key={od.id}>
              <button
                type="button"
                onClick={() => toggle(od.id)}
                className={`w-full text-left rounded-md border px-3 py-2 hover:bg-accent ${on ? "border-primary bg-accent" : "border-border"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">
                      {od.name}
                      {od.isFavorite ? (
                        <span className="ml-2 text-xs text-amber-600">★ favorite</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {od.ratingCount > 0 && od.ratingAvg
                        ? `${od.ratingAvg.toFixed(1)} ★ · ${od.ratingCount} reviews · `
                        : ""}
                      {od.shiftsCompleted} shifts completed
                    </div>
                  </div>
                  <div className="h-4 w-4 rounded-sm border flex items-center justify-center text-xs">
                    {on ? "✓" : ""}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <details className="mt-4">
        <summary className="text-xs cursor-pointer text-muted-foreground">
          Engagement agreement (you sign by clicking below)
        </summary>
        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border bg-secondary/40 p-3 text-xs">
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
        <span>
          I agree to the engagement terms above on behalf of the practice for
          any OD who accepts this invitation.
        </span>
      </label>

      {error ? (
        <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {selected.size} OD{selected.size === 1 ? "" : "s"} selected
        </div>
        <button
          onClick={submit}
          disabled={pending || selected.size === 0 || !agreed}
          className="ne-btn"
        >
          {pending ? "Sending invites…" : `Invite ${selected.size || ""}`.trim()}
        </button>
      </div>
    </div>
  );
}
