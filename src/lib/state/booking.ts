/**
 * Booking state machine. Mirrors §4 of the brief.
 *
 *   confirmed → in_progress → completed
 *        ↓             ↓          ↓
 *   cancelled       no_show ← ────┘
 *
 * Triggers:
 *   confirmed → in_progress  · auto at shift start_time
 *   in_progress → completed  · auto at shift end_time
 *   completed                · triggers payout (3 days out) + review prompts (2hr)
 *   no_show                  · practice reports + 15min grace · release fee hold · OD flag.
 *                              Allowed from completed too: the "Did the doctor show?"
 *                              prompt fires after auto-completion, so a no-show can be
 *                              reported in that post-completion window.
 */

import type { bookingStatusEnum } from "@/db/schema";

export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  confirmed: ["in_progress", "cancelled", "no_show"],
  in_progress: ["completed", "no_show"],
  completed: ["no_show"], // post-completion no-show window (attendance prompt)
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
