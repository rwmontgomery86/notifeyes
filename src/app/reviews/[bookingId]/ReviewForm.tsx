"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReview } from "./actions";

type Existing = {
  ratingOverall: number;
  ratingSpecifics: Record<string, number>;
  publicComment: string | null;
  privateFeedback: string | null;
} | null;

const PRACTICE_AXES = ["on_time", "patient_care", "charting", "team_fit"] as const;
const OD_AXES = ["clarity", "pay_promptness", "workflow"] as const;
const AXIS_LABELS: Record<string, string> = {
  on_time: "On time",
  patient_care: "Patient care",
  charting: "Charting",
  team_fit: "Team fit",
  clarity: "Brief / instructions clarity",
  pay_promptness: "Pay promptness",
  workflow: "Workflow",
};

export function ReviewForm({
  bookingId,
  authorRole,
  existing,
}: {
  bookingId: string;
  authorRole: "practice" | "od";
  existing: Existing;
}) {
  const router = useRouter();
  const axes = authorRole === "practice" ? PRACTICE_AXES : OD_AXES;
  const [overall, setOverall] = useState(existing?.ratingOverall ?? 5);
  const [specifics, setSpecifics] = useState<Record<string, number>>(
    existing?.ratingSpecifics ?? Object.fromEntries(axes.map((a) => [a, 5])),
  );
  const [publicComment, setPublicComment] = useState(existing?.publicComment ?? "");
  const [privateFeedback, setPrivateFeedback] = useState(
    existing?.privateFeedback ?? "",
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function submit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await submitReview({
        bookingId,
        ratingOverall: overall,
        ratingSpecifics: specifics,
        publicComment: publicComment.trim() || null,
        privateFeedback: privateFeedback.trim() || null,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not submit review");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="mt-6 grid gap-5">
      <div className="ne-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Overall
        </h2>
        <StarPicker value={overall} onChange={setOverall} />
      </div>

      <div className="ne-card grid gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Specifics
        </h2>
        {axes.map((axis) => (
          <div key={axis} className="flex items-center justify-between gap-3">
            <div className="text-sm">{AXIS_LABELS[axis]}</div>
            <StarPicker
              value={specifics[axis] ?? 5}
              onChange={(n) => setSpecifics({ ...specifics, [axis]: n })}
              size="sm"
            />
          </div>
        ))}
      </div>

      <div className="ne-card">
        <label>
          <span className="ne-label">Public comment (shown on profile)</span>
          <textarea
            rows={3}
            value={publicComment}
            onChange={(e) => setPublicComment(e.target.value)}
            className="ne-input h-auto"
            maxLength={1000}
          />
        </label>
        <label className="block mt-3">
          <span className="ne-label">Private feedback (NotifEyes only)</span>
          <textarea
            rows={2}
            value={privateFeedback}
            onChange={(e) => setPrivateFeedback(e.target.value)}
            className="ne-input h-auto"
            maxLength={1000}
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        {saved && !pending ? (
          <span className="text-sm font-medium text-green-700">
            Review saved.
          </span>
        ) : null}
        <button onClick={submit} disabled={pending} className="ne-btn">
          {pending
            ? "Submitting…"
            : existing || saved
              ? "Update review"
              : "Submit review"}
        </button>
      </div>
    </div>
  );
}

function StarPicker({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (n: number) => void;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "text-base" : "text-2xl";
  return (
    <div className={`mt-2 flex gap-1 ${dim}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={n <= value ? "text-amber-500" : "text-muted-foreground"}
          aria-label={`${n} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
