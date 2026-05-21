import "server-only";
import { env } from "@/env";

// Re-exported for server-side callers. Client components MUST import
// formatUsd from "@/lib/format" directly — the `server-only` marker above
// makes any client import of this module fail at build time.
export { formatUsd } from "./format";

export function shiftDurationHours(startsAt: Date, endsAt: Date, lunchMinutes: number): number {
  const ms = endsAt.getTime() - startsAt.getTime();
  const lunchMs = lunchMinutes * 60_000;
  return Math.max(0, (ms - lunchMs) / 3_600_000);
}

/**
 * Cost breakdown for a shift booking.
 *
 *   subtotal   = rate_per_hr × billable_hours
 *   fee        = subtotal × platform_fee_bps / 10000   (V1: 10% — TODO legal review)
 *   total      = subtotal + fee                        (practice pays this)
 *   od_payout  = subtotal                              (V1: OD receives subtotal)
 */
export function computeShiftCost(input: {
  rateCentsPerHour: number;
  startsAt: Date;
  endsAt: Date;
  lunchMinutes: number;
}) {
  const hours = shiftDurationHours(input.startsAt, input.endsAt, input.lunchMinutes);
  const subtotalCents = Math.round(input.rateCentsPerHour * hours);
  const feeCents = Math.round((subtotalCents * env.PLATFORM_FEE_BPS) / 10_000);
  const totalCents = subtotalCents + feeCents;
  return {
    hours,
    subtotalCents,
    feeCents,
    feeBps: env.PLATFORM_FEE_BPS,
    totalCents,
    odPayoutCents: subtotalCents,
  };
}

// formatUsd is re-exported above from "./format" so client components can
// import it without dragging env.ts into their bundle.
