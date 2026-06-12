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
 * FEE-ONLY (matchmaker) model: NotifEyes only ever charges the practice the
 * match fee. The OD's wage is paid by the practice DIRECTLY (off-platform) and
 * is never processed by NotifEyes for beta — it's recorded here only for display.
 *
 *   subtotal/wage   = rate_per_hr × billable_hours   (practice pays the OD directly)
 *   fee             = NOTIFEYES_MATCH_FEE_CENTS — one flat fee, no same-day premium
 *                     (removed per the 2026-06-10 flat-$10 decision)
 *   practiceCharge  = fee                             (the ONLY thing on the practice's card)
 *   total           = subtotal + fee                  (full economic value, for records)
 *
 * Pass `practiceChargeCents` to payments.createIntent. `wageCents` is the figure
 * shown to the OD as "you earn".
 * V1 placeholder — pricing is set by env: $10 flat per match.
 * --TODO: legal review --- final fee amount.
 */
export function computeShiftCost(input: {
  rateCentsPerHour: number;
  startsAt: Date;
  endsAt: Date;
  lunchMinutes: number;
}) {
  const hours = shiftDurationHours(input.startsAt, input.endsAt, input.lunchMinutes);
  const subtotalCents = Math.round(input.rateCentsPerHour * hours);
  const feeCents = env.NOTIFEYES_MATCH_FEE_CENTS;
  const totalCents = subtotalCents + feeCents;
  return {
    hours,
    subtotalCents,
    feeCents,
    totalCents,
    odPayoutCents: subtotalCents,
    // Fee-only model: the wage is paid directly by the practice; the only thing
    // NotifEyes charges (and the amount to authorize on the card) is the fee.
    wageCents: subtotalCents,
    practiceChargeCents: feeCents,
  };
}
