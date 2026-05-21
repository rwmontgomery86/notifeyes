"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  optometrists,
  practices,
  shifts,
  users,
} from "@/db/schema";
import { requireOd } from "@/lib/auth/guards";
import {
  assertBookingTransition,
  type BookingStatus,
} from "@/lib/state/booking";
import { dispatchNotification } from "@/lib/notifications";
import { formatShiftWhen } from "@/lib/dates";
import { enqueueBookingCompletedFollowups } from "@/lib/queue";

async function loadOwnBooking(bookingId: string, odId: string) {
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
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!row) return null;
  if (row.booking.odId !== odId) return null;
  return row;
}

export async function odCheckIn(bookingId: string) {
  const session = await requireOd();
  const odId = session.user.odId!;
  const row = await loadOwnBooking(bookingId, odId);
  if (!row) return { ok: false as const, error: "Booking not found" };
  if (row.booking.checkInAt) {
    return { ok: false as const, error: "Already checked in." };
  }
  // Allow check-in from 1h before start.
  if (
    row.shift.startsAt.getTime() - Date.now() >
    60 * 60_000
  ) {
    return {
      ok: false as const,
      error: "Check-in opens 1 hour before the shift starts.",
    };
  }
  if (
    row.booking.status !== "confirmed" &&
    row.booking.status !== "in_progress"
  ) {
    return {
      ok: false as const,
      error: `Cannot check in on a ${row.booking.status} booking.`,
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({
        checkInAt: sql`now()`,
        // If still confirmed, move to in_progress
        ...(row.booking.status === "confirmed"
          ? (assertBookingTransition(row.booking.status, "in_progress"),
            { status: "in_progress" as BookingStatus })
          : {}),
      })
      .where(eq(bookings.id, bookingId));
  });

  // Notify the practice (no SMS — not urgent)
  try {
    const [practiceUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, row.shift.postedByUserId))
      .limit(1);
    if (practiceUser) {
      await dispatchNotification({
        kind: "booking_confirmed", // closest existing kind for "OD checked in"
        userId: practiceUser.id,
        recipientEmail: practiceUser.email,
        subject: `${row.od.name} just checked in`,
        body: `${formatShiftWhen(row.shift.startsAt, row.shift.endsAt)}.`,
        actionUrl: `/bookings/${bookingId}`,
        channels: ["push", "email"],
        payload: { bookingId, event: "check_in" },
      });
    }
  } catch (err) {
    console.error("[check-in] notify failed:", err);
  }

  return { ok: true as const };
}

export async function odCheckOut(bookingId: string) {
  const session = await requireOd();
  const odId = session.user.odId!;
  const row = await loadOwnBooking(bookingId, odId);
  if (!row) return { ok: false as const, error: "Booking not found" };
  if (!row.booking.checkInAt) {
    return { ok: false as const, error: "Check in first." };
  }
  if (row.booking.checkOutAt) {
    return { ok: false as const, error: "Already checked out." };
  }
  if (
    row.booking.status !== "in_progress" &&
    row.booking.status !== "confirmed"
  ) {
    return {
      ok: false as const,
      error: `Cannot check out from a ${row.booking.status} booking.`,
    };
  }

  await db.transaction(async (tx) => {
    assertBookingTransition(row.booking.status, "completed");
    await tx
      .update(bookings)
      .set({ checkOutAt: sql`now()`, status: "completed" })
      .where(eq(bookings.id, bookingId));
    await tx
      .update(shifts)
      .set({ status: "completed" })
      .where(eq(shifts.id, row.shift.id));
  });

  // Enqueue follow-ups (review prompts + payout) with the standard 2h delay.
  try {
    await enqueueBookingCompletedFollowups(bookingId);
  } catch (err) {
    console.error("[check-out] enqueue follow-ups failed:", err);
  }

  // Notify the practice
  try {
    const [practiceUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, row.shift.postedByUserId))
      .limit(1);
    if (practiceUser) {
      await dispatchNotification({
        kind: "booking_confirmed",
        userId: practiceUser.id,
        recipientEmail: practiceUser.email,
        subject: `${row.od.name} just checked out — shift complete`,
        body: `${formatShiftWhen(row.shift.startsAt, row.shift.endsAt)}. Review prompts go out in 2 hours.`,
        actionUrl: `/bookings/${bookingId}`,
        channels: ["push", "email"],
        payload: { bookingId, event: "check_out" },
      });
    }
  } catch (err) {
    console.error("[check-out] notify failed:", err);
  }

  return { ok: true as const };
}
