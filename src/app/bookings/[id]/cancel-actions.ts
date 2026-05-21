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
import { requireSession } from "@/lib/auth/guards";
import { computeCancellationFee } from "@/lib/cancellation";
import { dispatchNotification } from "@/lib/notifications";
import { formatShiftWhen } from "@/lib/dates";
import { payments } from "@/lib/payments";

/**
 * Either side cancels.
 *
 *   1. Compute fee from time delta to start (§6D)
 *   2. Move booking → cancelled
 *   3. Move shift → cancelled (with urgent flag — practice can repost)
 *   4. Cancel payment intent (refund whatever wasn't captured)
 *   5. Notify the counterparty
 */
export async function cancelBooking(bookingId: string, reason: string) {
  const session = await requireSession();
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
  if (!row) return { ok: false as const, error: "Booking not found" };

  const isPractice = session.user.practiceId === row.booking.practiceId;
  const isOd = session.user.odId === row.booking.odId;
  if (!isPractice && !isOd && session.user.role !== "admin") {
    return { ok: false as const, error: "Forbidden" };
  }
  if (row.booking.status !== "confirmed" && row.booking.status !== "in_progress") {
    return { ok: false as const, error: `Cannot cancel a ${row.booking.status} booking.` };
  }

  const fee = computeCancellationFee({
    shiftStartsAt: row.shift.startsAt,
    totalCents: row.booking.totalCents,
  });

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({
        status: "cancelled",
        cancelledByUserId: session.user.id,
        cancellationReason: reason,
        cancellationFeeCents: fee.feeCents,
        cancelledAt: sql`now()`,
      })
      .where(eq(bookings.id, bookingId));
    await tx
      .update(shifts)
      .set({ status: "cancelled", urgent: true })
      .where(eq(shifts.id, row.shift.id));
  });

  // Payment cleanup — outside the tx
  if (row.booking.paymentIntentId) {
    try {
      if (fee.feeCents === 0) {
        await payments.cancel(row.booking.paymentIntentId);
      } else {
        await payments.refund(
          row.booking.paymentIntentId,
          row.booking.totalCents - fee.feeCents,
        );
      }
    } catch (err) {
      console.error("[cancel] payment cleanup failed:", err);
    }
  }

  // Notify counterparty
  try {
    const counterpartyUserId = isPractice
      ? (await db
          .select({ id: users.id, email: users.email, phone: users.phone })
          .from(users)
          .where(eq(users.odId, row.od.id))
          .limit(1))[0]
      : (await db
          .select({ id: users.id, email: users.email, phone: users.phone })
          .from(users)
          .where(eq(users.id, row.shift.postedByUserId))
          .limit(1))[0];

    if (counterpartyUserId) {
      const initiator = isPractice ? row.practice.name : row.od.name;
      await dispatchNotification({
        kind: "cancellation",
        userId: counterpartyUserId.id,
        recipientEmail: counterpartyUserId.email,
        recipientPhone: counterpartyUserId.phone ?? undefined,
        subject: `${initiator} cancelled the booking`,
        body: `${formatShiftWhen(row.shift.startsAt, row.shift.endsAt)} — reason: ${reason}`,
        actionUrl: `/bookings/${bookingId}`,
        channels: ["push", "email", "sms"],
        payload: { bookingId, feeBracket: fee.bracket },
      });
    }
  } catch (err) {
    console.error("[cancel] notify failed:", err);
  }

  return { ok: true as const };
}
