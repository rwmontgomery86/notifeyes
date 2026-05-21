/**
 * Booking state machine. Mirrors §4 of the brief.
 *
 *   confirmed → in_progress → completed
 *        ↓                       ↓
 *   cancelled                no_show
 *
 * Triggers:
 *   confirmed → in_progress  · auto at shift start_time (or OD check-in)
 *   in_progress → completed  · auto at shift end_time (or OD check-out)
 *   completed                · triggers payout (3 days out) + review prompts (2hr)
 *   no_show                  · practice reports + 30min grace · auto-refund · OD flag
 */

import type { bookingStatusEnum } from "@/db/schema";

export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  confirmed: ["in_progress", "cancelled", "no_show"],
  in_progress: ["completed", "no_show"],
  completed: [], // terminal
  cancelled: [], // terminal
  no_show: [], // terminal
};

export function canTransitionBooking(
  from: BookingStatus,
  to: BookingStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertBookingTransition(
  from: BookingStatus,
  to: BookingStatus,
): void {
  if (!canTransitionBooking(from, to)) {
    throw new Error(`Invalid booking transition: ${from} → ${to}`);
  }
}
