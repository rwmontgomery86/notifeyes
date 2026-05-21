/**
 * Shift state machine guards. Mirrors §4 of the brief.
 *
 *   draft → posted → booked → completed
 *           ↓        ↓
 *      cancelled  cancelled (with fee)
 */

import type { shiftStatusEnum } from "@/db/schema";

export type ShiftStatus = (typeof shiftStatusEnum.enumValues)[number];

const TRANSITIONS: Record<ShiftStatus, ShiftStatus[]> = {
  draft: ["posted", "cancelled"],
  posted: ["booked", "cancelled"],
  booked: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransitionShift(
  from: ShiftStatus,
  to: ShiftStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertShiftTransition(
  from: ShiftStatus,
  to: ShiftStatus,
): void {
  if (!canTransitionShift(from, to)) {
    throw new Error(`Invalid shift transition: ${from} → ${to}`);
  }
}
