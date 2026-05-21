/**
 * Cancellation fee schedule (§6D of the brief).
 *
 *   > 7 days  : 0%
 *   2–7 days  : 25%
 *   < 48 hrs  : 50%
 *   < 4 hrs   : 100%
 *
 * --TODO: legal review --- percentages above are placeholders per §6D. Final
 * schedule needs attorney + market review before any real launch.
 */

export interface CancellationFee {
  bracket: "free" | "25pct" | "50pct" | "100pct";
  feeCents: number;
  copy: string;
}

export function computeCancellationFee(opts: {
  shiftStartsAt: Date;
  totalCents: number;
  now?: Date;
}): CancellationFee {
  const now = opts.now ?? new Date();
  const hours = (opts.shiftStartsAt.getTime() - now.getTime()) / 3_600_000;

  if (hours >= 168) {
    return {
      bracket: "free",
      feeCents: 0,
      copy: "No fee — more than 7 days out.",
    };
  }
  if (hours >= 48) {
    return {
      bracket: "25pct",
      feeCents: Math.round(opts.totalCents * 0.25),
      copy: "25% fee — 2–7 days before the shift.",
    };
  }
  if (hours >= 4) {
    return {
      bracket: "50pct",
      feeCents: Math.round(opts.totalCents * 0.5),
      copy: "50% fee — less than 48 hours before the shift.",
    };
  }
  return {
    bracket: "100pct",
    feeCents: opts.totalCents,
    copy: "100% fee — less than 4 hours before the shift.",
  };
}
