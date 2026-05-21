"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createShift } from "./actions";

const SHIFT_TYPES = [
  { v: "fill_in", label: "Fill-in (single day)" },
  { v: "half_day", label: "Half day" },
  { v: "weekend", label: "Weekend" },
] as const;

export function ShiftForm({ practiceCity }: { practiceCity: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(e: React.FormEvent<HTMLFormElement>, action: "draft" | "post") {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("action", action);
    startTransition(async () => {
      const res = await createShift(fd);
      if (!res.ok) {
        setError(res.error ?? "Could not create shift");
        return;
      }
      router.push(`/p/shifts/${res.shiftId}`);
    });
  }

  // Default values that make filling out the form fast in dev
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 3600 * 1000);
  const yyyymmdd = tomorrow.toISOString().slice(0, 10);

  return (
    <form className="mt-8 grid gap-5" onSubmit={(e) => handle(e, "post")}>
      <Section title="When">
        <div className="grid gap-4 md:grid-cols-3">
          <label>
            <span className="ne-label">Date</span>
            <input
              type="date"
              name="date"
              required
              defaultValue={yyyymmdd}
              className="ne-input"
            />
          </label>
          <label>
            <span className="ne-label">Start</span>
            <input
              type="time"
              name="startTime"
              required
              defaultValue="09:00"
              className="ne-input"
            />
          </label>
          <label>
            <span className="ne-label">End</span>
            <input
              type="time"
              name="endTime"
              required
              defaultValue="17:00"
              className="ne-input"
            />
          </label>
        </div>
        <label className="block mt-3 max-w-xs">
          <span className="ne-label">Lunch break (minutes)</span>
          <input
            type="number"
            name="lunchMinutes"
            defaultValue={30}
            min={0}
            max={120}
            className="ne-input"
          />
        </label>
      </Section>

      <Section title="Shift type & rate">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="ne-label">Type</span>
            <select name="type" defaultValue="fill_in" className="ne-input" required>
              {SHIFT_TYPES.map((t) => (
                <option key={t.v} value={t.v}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="ne-label">Rate (USD per hour)</span>
            <input
              type="number"
              name="ratePerHour"
              defaultValue={110}
              min={50}
              max={500}
              step={5}
              required
              className="ne-input"
            />
          </label>
        </div>
      </Section>

      <Section title="Notes for the OD">
        <label className="block">
          <span className="ne-label">
            Anything the OD should know before they arrive
            {practiceCity ? ` (location: ${practiceCity})` : ""}
          </span>
          <textarea
            name="notesForOd"
            rows={3}
            placeholder="Parking, dress code, EHR notes, special services needed…"
            className="ne-input h-auto"
          />
        </label>
      </Section>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={(e) =>
            handle(e as unknown as React.FormEvent<HTMLFormElement>, "draft")
          }
          className="ne-btn-secondary"
          disabled={pending}
        >
          Save draft
        </button>
        <button type="submit" className="ne-btn" disabled={pending}>
          {pending ? "Posting…" : "Post shift"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="ne-card">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </legend>
      <div className="mt-2">{children}</div>
    </fieldset>
  );
}
