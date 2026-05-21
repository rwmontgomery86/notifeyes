/**
 * Periodic scan that auto-advances bookings against the wall clock.
 *
 *   confirmed → in_progress   at shift.starts_at
 *   in_progress → completed   at shift.ends_at
 *   confirmed → completed     at shift.ends_at (if we missed in_progress)
 *
 * Per §4 of the brief. The state-machine guards permit both transitions.
 *
 * On entering `completed`, we enqueue `booking-completed-followups` with a
 * 2-hour delay (per §6F: review prompts fire 2h after completion). The
 * follow-up worker also seeds the scheduled Payout row (§8).
 *
 * Idempotency: each pass only touches rows whose status hasn't already
 * advanced past the target, so re-running is a no-op.
 */

import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, shifts } from "@/db/schema";
import { getBoss } from "../boss";

const QUEUE_BOOKING_COMPLETED = "booking-completed-followups";

export async function advanceBookings(): Promise<void> {
  // Find bookings whose shift has started but they're still 'confirmed'
  const toInProgress = await db
    .select({ id: bookings.id })
    .from(bookings)
    .innerJoin(shifts, eq(shifts.id, bookings.shiftId))
    .where(
      and(
        eq(bookings.status, "confirmed"),
        lte(shifts.startsAt, sql`now()`),
        sql`${shifts.endsAt} > now()`,
      ),
    );

  if (toInProgress.length) {
    await db
      .update(bookings)
      .set({ status: "in_progress" })
      .where(inArray(bookings.id, toInProgress.map((b) => b.id)));
    console.log(`[booking-progression] confirmed → in_progress · ${toInProgress.length}`);
  }

  // Find bookings whose shift has ended — move to completed.
  // Accepts either confirmed or in_progress as the prior state.
  const toCompleted = await db
    .select({ id: bookings.id })
    .from(bookings)
    .innerJoin(shifts, eq(shifts.id, bookings.shiftId))
    .where(
      and(
        sql`${bookings.status} IN ('confirmed','in_progress')`,
        lte(shifts.endsAt, sql`now()`),
      ),
    );

  if (toCompleted.length) {
    await db
      .update(bookings)
      .set({ status: "completed" })
      .where(inArray(bookings.id, toCompleted.map((b) => b.id)));
    await db
      .update(shifts)
      .set({ status: "completed" })
      .where(
        inArray(
          shifts.id,
          (
            await db
              .select({ shiftId: bookings.shiftId })
              .from(bookings)
              .where(inArray(bookings.id, toCompleted.map((b) => b.id)))
          ).map((r) => r.shiftId),
        ),
      );
    console.log(`[booking-progression] → completed · ${toCompleted.length}`);

    // Enqueue follow-ups (review prompts + payout) with a 2-hour delay.
    const boss = await getBoss();
    for (const b of toCompleted) {
      await boss.send(
        QUEUE_BOOKING_COMPLETED,
        { bookingId: b.id },
        { startAfter: 60 * 60 * 2 }, // 2 hours in seconds
      );
    }
  }
}
