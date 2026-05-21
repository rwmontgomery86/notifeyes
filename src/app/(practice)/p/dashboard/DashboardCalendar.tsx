"use client";

import { useState } from "react";
import Link from "next/link";
import { formatUsd } from "@/lib/format";

type ShiftLite = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  rateCentsPerHour: number;
  type: string;
};

export function DashboardCalendar({
  year,
  month,
  shifts,
}: {
  year: number;
  month: number;
  shifts: ShiftLite[];
}) {
  // Build the 6-week grid
  const firstOfMonth = new Date(year, month, 1);
  // 0 = Sunday … 6 = Saturday
  const gridStartDow = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Days from prev month to fill the first row
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = gridStartDow - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month, -i),
      inMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  // Fill to a multiple of 7, plus an extra week if needed
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1]!.date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    cells.push({ date: next, inMonth: next.getMonth() === month });
    if (cells.length >= 42) break;
  }

  // Group shifts by yyyy-mm-dd in local time
  const shiftsByDay = new Map<string, ShiftLite[]>();
  for (const s of shifts) {
    const d = new Date(s.startsAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const arr = shiftsByDay.get(key) ?? [];
    arr.push(s);
    shiftsByDay.set(key, arr);
  }

  const todayKey = keyFor(new Date());
  const [selected, setSelected] = useState<string | null>(todayKey);
  const selectedShifts = selected ? shiftsByDay.get(selected) ?? [] : [];

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[3fr_2fr]">
      <div className="ne-card p-0 overflow-hidden">
        <div className="grid grid-cols-7 border-b text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-1 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c, i) => {
            const key = keyFor(c.date);
            const dayShifts = shiftsByDay.get(key) ?? [];
            const isSelected = selected === key;
            const isToday = key === todayKey;
            return (
              <button
                key={i}
                onClick={() => setSelected(key)}
                className={
                  "min-h-[72px] border-r border-b last:border-r-0 px-1.5 py-1 text-left transition-colors " +
                  (isSelected ? "bg-accent " : "hover:bg-accent/50 ") +
                  (!c.inMonth ? "text-muted-foreground/50 bg-secondary/30 " : "")
                }
              >
                <div
                  className={
                    "text-xs " +
                    (isToday ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold" : "")
                  }
                >
                  {c.date.getDate()}
                </div>
                <div className="mt-1 space-y-0.5">
                  {dayShifts.slice(0, 3).map((s) => (
                    <ShiftPill key={s.id} s={s} />
                  ))}
                  {dayShifts.length > 3 ? (
                    <div className="text-[10px] text-muted-foreground">
                      +{dayShifts.length - 3} more
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="ne-card max-h-[400px] overflow-y-auto">
        <h3 className="text-sm font-semibold">
          {selected
            ? new Date(selected + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
            : "Pick a day"}
        </h3>
        <div className="mt-3 space-y-2">
          {selectedShifts.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No shifts on this day.{" "}
              <Link href="/p/shifts/new" className="font-medium text-primary">
                Post one →
              </Link>
            </div>
          ) : null}
          {selectedShifts.map((s) => (
            <Link
              key={s.id}
              href={`/p/shifts/${s.id}`}
              className="block rounded-md border px-3 py-2 hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">
                    {timeRange(s.startsAt, s.endsAt)}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {s.type.replace("_", " ")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {formatUsd(s.rateCentsPerHour)}/hr
                  </div>
                  <span
                    className={
                      "ne-pill capitalize " +
                      statusBadge(s.status)
                    }
                  >
                    {s.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShiftPill({ s }: { s: ShiftLite }) {
  const cls = statusBadge(s.status);
  return (
    <Link
      href={`/p/shifts/${s.id}`}
      className={
        "block truncate rounded px-1 py-0.5 text-[10px] font-medium border " +
        cls
      }
      onClick={(e) => e.stopPropagation()}
    >
      {timeRange(s.startsAt, s.endsAt).split(" ")[0]} · {formatUsd(s.rateCentsPerHour)}
    </Link>
  );
}

function statusBadge(status: string): string {
  if (status === "posted") return "border-amber-500/40 bg-amber-100/60 text-amber-900";
  if (status === "booked") return "border-primary/40 bg-accent text-accent-foreground";
  if (status === "completed") return "border-green-500/40 bg-green-100/60 text-green-900";
  if (status === "cancelled") return "border-destructive/40 bg-destructive/10 text-destructive";
  return "border-border text-muted-foreground";
}

function keyFor(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const fmt: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  return `${s.toLocaleTimeString("en-US", fmt)}–${e.toLocaleTimeString("en-US", fmt)}`;
}
