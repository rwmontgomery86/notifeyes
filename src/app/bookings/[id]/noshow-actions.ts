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
import { requirePractice } from "@/lib/auth/guards";
import { dispatchNotification } from "@/lib/notifications";
import { payments } from "@/lib/payments";

export async function reportNoShow(bookingId: string, reason: string | null) {
  const session = await requirePractice();
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
  if (
    row.booking.practiceId !== session.user.practiceId &&
    session.user.role !== "admin"
  ) {
    return { ok: false as const, error: "Forbidden" };
  }
  if (row.booking.status !== "confirmed" && row.booking.status !== "in_progress") {
    return {
      ok: false as const,
      error: `Cannot report no-show on a ${row.booking.status} booking.`,
    };
  }
  if (row.shift.startsAt.getTime() > Date.now() - 15 * 60_000) {
    return {
      ok: false as const,
      error: "Wait 15 minutes after the shift start time before reporting.",
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({
        status: "no_show",
        cancelledByUserId: session.user.id,
        cancellationReason: reason,
        cancelledAt: sql`now()`,
      })
      .where(eq(bookings.id, bookingId));
    await tx
      .update(shifts)
      .set({ status: "cancelled", urgent: true })
      .where(eq(shifts.id, row.shift.id));
    await tx
      .update(optometrists)
      .set({ noShowCount: sql`${optometrists.noShowCount} + 1` })
      .where(eq(optometrists.id, row.od.id));
  });

  // Full refund — auto per §6E
  if (row.booking.paymentIntentId) {
    try {
      await payments.refund(row.booking.paymentIntentId);
    } catch (err) {
      console.error("[no-show] refund failed:", err);
    }
  }

  // Notify the OD that they were marked no-show
  try {
    const [odUser] = await db
      .select({ id: users.id, email: users.email, phone: users.phone })
      .from(users)
      .where(eq(users.odId, row.od.id))
      .limit(1);
    if (odUser) {
      await dispatchNotification({
        kind: "cancellation",
        userId: odUser.id,
        recipientEmail: odUser.email,
        recipientPhone: odUser.phone ?? undefined,
        subject: `Your booking was reported as a no-show`,
        body: `${row.practice.name} reported a no-show. ${reason ? `Note: ${reason}.` : ""} If this is in error, reply to the practice or contact NotifEyes support.`,
        actionUrl: `/bookings/${bookingId}`,
        channels: ["push", "email", "sms"],
        payload: { bookingId, kind: "no_show" },
      });
    }
  } catch (err) {
    console.error("[no-show] notify failed:", err);
  }

  return { ok: true as const };
}
