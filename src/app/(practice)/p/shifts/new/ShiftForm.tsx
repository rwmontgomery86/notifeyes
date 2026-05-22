"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createShift } from "./actions";
import { updateShift } from "../[id]/edit/actions";

const SHIFT_TYPES = [
  { v: "fill_in", label: "Fill-in (single day)" },
  { v: "half_day", label: "Half day" },
  { v: "weekend", label: "Weekend" },
] as const;

export type ShiftFormInitial = {
  date: string;
  startTime: string;
  endTime: string;
  lunchMinutes: number;
  type: "fill_in" | "half_day" | "weekend";
  ratePerHour: number;
  notesForOd: string;
};

export function ShiftForm({
  practiceCity,
  mode = "create",
  shiftId,
  initial,
}: {
  practiceCity: string | null;
  mode?: "create" | "edit";
  shiftId?: string;
  initial?: ShiftFormInitial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(e: React.SyntheticEvent, action: "draft" | "post") {
    e.preventDefault();
    setError(null);
    const target = e.currentTarget as HTMLElement;
    const form =
      target instanceof HTMLFormElement ? target : target.closest("form");
    if (!(form instanceof HTMLFormElement)) {
      setError("Form not found");
      return;
    }
    const fd = new FormData(form);
    fd.set("action", action);
    startTransition(async () => {
      const res =
        mode === "edit" && shiftId
          ? await updateShift(shiftId, fd)
          : await createShift(fd);
      if (!res.ok) {
        setError(res.error ?? "Could not save shift");
        return;
      }
      // On post, jump to the shift detail. On draft save, return to the draft list.
      if (action === "post") {
        router.push(`/p/shifts/${"shiftId" in res ? res.shiftId : shiftId}`);
      } else if (mode === "edit") {
        router.push("/p/shifts?status=draft");
      } else {
        router.push(`/p/shifts/${"shiftId" in res ? res.shiftId : shiftId}`);
      }
    });
  }

  // Default values that make filling out the form fast in dev
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 3600 * 1000);
  const yyyymmdd = tomorrow.toISOString().slice(0, 10);

  const v: ShiftFormInitial = initial ?? {
    date: yyyymmdd,
    startTime: "09:00",
    endTime: "17:00",
    lunchMinutes: 30,
    type: "fill_in",
    ratePerHour: 110,
    notesForOd: "",
  };

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
              defaultValue={v.date}
              className="ne-input"
            />
          </label>
          <label>
            <span className="ne-label">Start</span>
            <input
              type="time"
              name="startTime"
              required
              defaultValue={v.startTime}
              className="ne-input"
            />
          </label>
          <label>
            <span className="ne-label">End</span>
            <input
              type="time"
              name="endTime"
              required
              defaultValue={v.endTime}
              className="ne-input"
            />
          </label>
        </div>
        <label className="block mt-3 max-w-xs">
          <span className="ne-label">Lunch break (minutes)</span>
          <input
            type="number"
            name="lunchMinutes"
            defaultValue={v.lunchMinutes}
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
            <select name="type" defaultValue={v.type} className="ne-input" required>
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
              defaultValue={v.ratePerHour}
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
            defaultValue={v.notesForOd}
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
          onClick={(e) => handle(e, "draft")}
          className="ne-btn-secondary"
          disabled={pending}
        >
          {mode === "edit" ? "Save draft" : "Save draft"}
        </button>
        <button type="submit" className="ne-btn" disabled={pending}>
          {pending ? "Posting…" : mode === "edit" ? "Post shift" : "Post shift"}
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
