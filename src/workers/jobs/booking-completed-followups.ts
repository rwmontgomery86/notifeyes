/**
 * Booking completion follow-up.
 *
 * Fires 2 hours after a booking transitions to status='completed' (per §6F).
 * Dispatches `review_request` to both parties so they go fill out the form.
 *
 * Also seeds a Payout row (scheduled 3 days out) per §8.
 *
 * Triggered by the booking state-machine — see worker `booking-completed` queue.
 */

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  optometrists,
  payouts,
  practices,
  shifts,
  users,
} from "@/db/schema";
import { dispatchNotification } from "@/lib/notifications";
import { formatShiftWhen } from "@/lib/dates";

export interface BookingCompletedData {
  bookingId: string;
}

export async function bookingCompletedFollowups(
  data: BookingCompletedData,
): Promise<void> {
  const [row] = await db
    .select({
      booking: bookings,
      shift: shifts,
      practice: practices,
      od: optometrists,
    })
    .from(bookings)
    .innerJoin(shifts, eq(shifts.id, bookings.shiftId))
    .innerJoin(practices, eq(practices.id, bookings.practiceId))
    .innerJoin(optometrists, eq(optometrists.id, bookings.odId))
    .where(eq(bookings.id, data.bookingId))
    .limit(1);
  if (!row || row.booking.status !== "completed") return;

  // Payout — scheduled for 3 days from now (§8 of brief)
  const odPayout = row.booking.totalCents - row.booking.platformFeeCents;
  await db
    .insert(payouts)
    .values({
      bookingId: row.booking.id,
      odId: row.od.id,
      amountCents: odPayout,
      status: "scheduled",
      scheduledFor: sql`now() + interval '3 days'`,
    })
    .onConflictDoNothing();

  // Find user accounts for both sides
  const [odUser] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.odId, row.od.id))
    .limit(1);
  const [practiceUser] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, row.shift.postedByUserId))
    .limit(1);

  const when = formatShiftWhen(row.shift.startsAt, row.shift.endsAt);

  if (odUser) {
    await dispatchNotification({
      kind: "review_request",
      userId: odUser.id,
      recipientEmail: odUser.email,
      subject: `Rate your shift at ${row.practice.name}`,
      body: `${when} · share how it went. Reviews stay blind until both sides submit or 7 days pass.`,
      actionUrl: `/reviews/${row.booking.id}`,
      channels: ["push", "email"],
      payload: { bookingId: row.booking.id },
    });
  }
  if (practiceUser) {
    await dispatchNotification({
      kind: "review_request",
      userId: practiceUser.id,
      recipientEmail: practiceUser.email,
      subject: `Rate ${row.od.name} for your shift`,
      body: `${when} · share how it went. Reviews stay blind until both sides submit or 7 days pass.`,
      actionUrl: `/reviews/${row.booking.id}`,
      channels: ["push", "email"],
      payload: { bookingId: row.booking.id },
    });
  }
}
