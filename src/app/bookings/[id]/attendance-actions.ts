"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, optometrists, practices, shifts, users } from "@/db/schema";
import { requirePractice } from "@/lib/auth/guards";
import { payments } from "@/lib/payments";
import { dispatchNotification } from "@/lib/notifications";
import { formatShiftWhen } from "@/lib/dates";

/**
 * Practice confirms the OD showed up for the shift.
 *
 * Fee-only model: this is the moment the $10 match fee is actually captured
 * (it was only authorized/held at booking). No charge ever happens for a shift
 * the practice doesn't confirm — a no-show releases the hold (see no-show flow).
 * The OD's wage is paid directly by the practice and never touches NotifEyes.
 */
export async function confirmAttendance(bookingId: string) {
  const session = await requirePractice();
  const practiceId = session.user.practiceId!;

  const [row] = await db
    .select({
      booking: bookings,
      shift: shifts,
      od: optometrists,
      practice: practices,
    })
    .from(bookings)
    .innerJoin(shifts, eq(shifts.id, bookings.shiftId))
    .innerJoin(optometrists, eq(optometrists.id, bookings.odId))
    .innerJoin(practices, eq(practices.id, bookings.practiceId))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row || row.booking.practiceId !== practiceId) {
    return { ok: false as const, error: "Booking not found." };
  }
  if (row.booking.attendanceConfirmedAt) {
    return { ok: false as const, error: "Attendance already confirmed." };
  }
  if (row.booking.status === "cancelled" || row.booking.status === "no_show") {
    return {
      ok: false as const,
      error: `Can't confirm attendance on a ${row.booking.status} booking.`,
    };
  }
  if (row.shift.startsAt.getTime() > Date.now()) {
    return {
      ok: false as const,
      error: "You can confirm attendance once the shift has started.",
    };
  }

  // Capture the match fee (the hold placed at booking).
  let paymentStatus = row.booking.paymentStatus;
  if (row.booking.paymentIntentId) {
    try {
      const captured = await payments.capture(row.booking.paymentIntentId);
      paymentStatus = captured.status;
    } catch (err) {
      // Record attendance regardless; the fee can be reconciled/retried later.
      console.error("[attendance] fee capture failed:", err);
    }
  }

  await db
    .update(bookings)
    .set({
      attendanceConfirmedAt: sql`now()`,
      attendanceConfirmedByUserId: session.user.id,
      paymentStatus,
    })
    .where(eq(bookings.id, bookingId));

  // Let the OD know they're confirmed and their wage is due (paid directly).
  try {
    const [odUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.odId, row.od.id))
      .limit(1);
    if (odUser) {
      await dispatchNotification({
        kind: "attendance_check",
        userId: odUser.id,
        recipientEmail: odUser.email,
        subject: `${row.practice.name} confirmed your shift`,
        body: `${formatShiftWhen(row.shift.startsAt, row.shift.endsAt)} — the practice confirmed you showed up. Your wage is paid to you directly by the practice.`,
        actionUrl: `/bookings/${bookingId}`,
        channels: ["push", "email"],
        payload: { bookingId },
      });
    }
  } catch (err) {
    console.error("[attendance] notify OD failed:", err);
  }

  return { ok: true as const };
}
