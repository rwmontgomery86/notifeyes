/**
 * Cancellation policy — REPUTATION-ONLY (fee-only money model).
 *
 * NotifEyes never holds the OD's wage, so it can't charge a "% of wage"
 * cancellation fee. Cancelling costs nothing through the platform: we notify the
 * other side, reopen the shift, and record the cancellation on the canceller's
 * reliability record. How close to the shift it is drives the *severity* of that
 * record (and the warning we show), not a charge.
 *
 * --TODO: legal review --- severity thresholds + reliability-record policy.
 */

export type CancellationSeverity = "routine" | "late" | "last_minute";

export interface CancellationNotice {
  severity: CancellationSeverity;
  copy: string;
}

export function cancellationNotice(opts: {
  shiftStartsAt: Date;
  now?: Date;
}): CancellationNotice {
  const now = opts.now ?? new Date();
  const hours = (opts.shiftStartsAt.getTime() - now.getTime()) / 3_600_000;

  if (hours >= 48) {
    return {
      severity: "routine",
      copy: "No charge. We notify the other side and reopen the shift.",
    };
  }
  if (hours >= 4) {
    return {
      severity: "late",
      copy: "No charge — but cancelling less than 48 hours out is recorded on your reliability record.",
    };
  }
  return {
    severity: "last_minute",
    copy: "No charge — but a last-minute cancellation (under 4 hours) is recorded on your reliability record and hurts your standing.",
  };
}
