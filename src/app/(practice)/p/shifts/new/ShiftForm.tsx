"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createShift, previewReach } from "./actions";
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

  // Form-level state for the fields the reach estimate depends on.
  const [date, setDate] = useState(v.date);
  const [startTime, setStartTime] = useState(v.startTime);
  const [endTime, setEndTime] = useState(v.endTime);
  const [shiftType, setShiftType] = useState<typeof v.type>(v.type);
  const [ratePerHour, setRatePerHour] = useState<number>(v.ratePerHour);
  const [boostOn, setBoostOn] = useState(false);
  const [bumpRatePerHour, setBumpRatePerHour] = useState<number>(
    v.ratePerHour + 20,
  );

  // Debounced reach preview.
  const [reach, setReach] = useState<{
    count: number;
    bumpedCount: number;
  } | null>(null);
  const [reachPending, setReachPending] = useState(false);
  const [reachError, setReachError] = useState<string | null>(null);
  useEffect(() => {
    setReachPending(true);
    const t = setTimeout(async () => {
      const res = await previewReach({
        date,
        startTime,
        endTime,
        type: shiftType,
        ratePerHour,
        bumpRatePerHour: boostOn ? bumpRatePerHour : null,
      });
      if (res.ok) {
        setReach({ count: res.count, bumpedCount: res.bumpedCount });
        setReachError(null);
      } else {
        setReach(null);
        setReachError(res.error);
      }
      setReachPending(false);
    }, 300);
    return () => clearTimeout(t);
  }, [date, startTime, endTime, shiftType, ratePerHour, boostOn, bumpRatePerHour]);

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
    // Only include bumpRatePerHour when boost is on. Empty/zero is the signal it's off.
    if (boostOn && bumpRatePerHour > ratePerHour) {
      fd.set("bumpRatePerHour", String(bumpRatePerHour));
    } else {
      fd.delete("bumpRatePerHour");
    }
    startTransition(async () => {
      const res =
        mode === "edit" && shiftId
          ? await updateShift(shiftId, fd)
          : await createShift(fd);
      if (!res.ok) {
        const redirectTo = "redirectTo" in res ? res.redirectTo : undefined;
        if (redirectTo) {
          router.push(redirectTo);
          return;
        }
        setError(res.error ?? "Could not save shift");
        return;
      }
      if (action === "post") {
        router.push(`/p/shifts/${"shiftId" in res ? res.shiftId : shiftId}`);
      } else if (mode === "edit") {
        router.push("/p/shifts?status=draft");
      } else {
        router.push(`/p/shifts/${"shiftId" in res ? res.shiftId : shiftId}`);
      }
    });
  }

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
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="ne-input"
            />
          </label>
          <label>
            <span className="ne-label">Start</span>
            <input
              type="time"
              name="startTime"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="ne-input"
            />
          </label>
          <label>
            <span className="ne-label">End</span>
            <input
              type="time"
              name="endTime"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
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
            <select
              name="type"
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value as typeof v.type)}
              className="ne-input"
              required
            >
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
              value={ratePerHour}
              onChange={(e) => setRatePerHour(Number(e.target.value) || 0)}
              min={50}
              max={500}
              step={5}
              required
              className="ne-input"
            />
          </label>
        </div>

        <div className="mt-3">
          <ReachPill
            reach={reach}
            pending={reachPending}
            error={reachError}
            boostOn={boostOn}
          />
        </div>
      </Section>

      <Section title="Boost — reach ODs outside their watch zones">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={boostOn}
            onChange={(e) => {
              const on = e.target.checked;
              setBoostOn(on);
              if (on && bumpRatePerHour <= ratePerHour) {
                setBumpRatePerHour(ratePerHour + 20);
              }
            }}
            className="mt-1"
          />
          <span>
            Pay extra to surface this shift to ODs within 25 miles whose watch
            zones don&apos;t include you. Useful when in-zone supply is thin or a
            shift sits unfilled.
          </span>
        </label>
        {boostOn ? (
          <div className="mt-3 max-w-xs">
            <label>
              <span className="ne-label">Boosted rate (USD per hour)</span>
              <input
                type="number"
                value={bumpRatePerHour}
                onChange={(e) =>
                  setBumpRatePerHour(Number(e.target.value) || 0)
                }
                min={ratePerHour + 5}
                max={500}
                step={5}
                className="ne-input"
              />
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Must be at least ${ratePerHour + 5}/hr. The boosted rate replaces
              the base rate for every OD who books.
            </p>
          </div>
        ) : null}
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

function ReachPill({
  reach,
  pending,
  error,
  boostOn,
}: {
  reach: { count: number; bumpedCount: number } | null;
  pending: boolean;
  error: string | null;
  boostOn: boolean;
}) {
  if (error) {
    return (
      <span className="ne-pill border-border bg-muted/40 text-muted-foreground">
        Reach: — ({error})
      </span>
    );
  }
  if (!reach && pending) {
    return (
      <span className="ne-pill border-border bg-muted/40 text-muted-foreground">
        Estimating reach…
      </span>
    );
  }
  if (!reach) return null;
  const base = reach.count - reach.bumpedCount;
  return (
    <span className="ne-pill border-amber-500/40 bg-amber-100/60 text-amber-900">
      ~{reach.count} OD{reach.count === 1 ? "" : "s"} would be notified
      {boostOn && reach.bumpedCount > 0
        ? ` · ${base} in zone + ${reach.bumpedCount} added by boost`
        : ""}
    </span>
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
