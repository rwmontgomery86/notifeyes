"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  applications,
  bookings,
  optometrists,
  practices,
  shifts,
  users,
} from "@/db/schema";
import { requirePractice } from "@/lib/auth/guards";
import { formatShiftWhen } from "@/lib/dates";
import { dispatchNotification } from "@/lib/notifications";
import { assertShiftTransition } from "@/lib/state/shift";
import { cancelBooking } from "@/app/bookings/[id]/cancel-actions";

type Result =
  | { ok: true }
  | { ok: false; error: string };

const OPEN_APPLICATION_STATUSES = ["applied", "shortlisted", "offered"] as const;

export async function cancelShift(shiftId: string, reason: string): Promise<Result> {
  const session = await requirePractice();
  const trimmedReason = reason.trim();

  const [row] = await db
    .select({ shift: shifts, practice: practices })
    .from(shifts)
    .innerJoin(practices, eq(practices.id, shifts.practiceId))
    .where(eq(shifts.id, shiftId))
    .limit(1);
  if (!row) return { ok: false, error: "Shift not found" };
  if (
    row.shift.practiceId !== session.user.practiceId &&
    session.user.role !== "admin"
  ) {
    return { ok: false, error: "Forbidden" };
  }

  const status = row.shift.status;

  if (status === "completed" || status === "cancelled") {
    return { ok: false, error: `Can't cancel a ${status} shift.` };
  }

  if (status === "draft") {
    await db
      .delete(shifts)
      .where(and(eq(shifts.id, shiftId), eq(shifts.status, "draft")));
    return { ok: true };
  }

  if (status === "booked") {
    if (!trimmedReason) return { ok: false, error: "Please provide a reason." };
    const [booking] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.shiftId, shiftId))
      .limit(1);
    if (!booking) {
      return { ok: false, error: "Booking row missing for booked shift." };
    }
    return cancelBooking(booking.id, trimmedReason);
  }

  // status === "posted"
  if (!trimmedReason) return { ok: false, error: "Please provide a reason." };
  assertShiftTransition("posted", "cancelled");

  const openApps = await db
    .select({
      applicationId: applications.id,
      odId: applications.odId,
      userId: users.id,
      email: users.email,
      phone: users.phone,
      odName: optometrists.name,
    })
    .from(applications)
    .innerJoin(optometrists, eq(optometrists.id, applications.odId))
    .innerJoin(users, eq(users.odId, optometrists.id))
    .where(
      and(
        eq(applications.shiftId, shiftId),
        inArray(applications.status, [...OPEN_APPLICATION_STATUSES]),
      ),
    );

  await db.transaction(async (tx) => {
    await tx
      .update(shifts)
      .set({ status: "cancelled" })
      .where(and(eq(shifts.id, shiftId), eq(shifts.status, "posted")));
    if (openApps.length > 0) {
      await tx
        .update(applications)
        .set({ status: "declined", statusChangedAt: sql`now()` })
        .where(
          and(
            eq(applications.shiftId, shiftId),
            inArray(applications.status, [...OPEN_APPLICATION_STATUSES]),
          ),
        );
    }
  });

  const whenLabel = formatShiftWhen(row.shift.startsAt, row.shift.endsAt);
  for (const a of openApps) {
    try {
      await dispatchNotification({
        kind: "cancellation",
        userId: a.userId,
        recipientEmail: a.email,
        recipientPhone: a.phone ?? undefined,
        subject: `${row.practice.name} cancelled a shift you applied to`,
        body: `${whenLabel} — reason: ${trimmedReason}`,
        actionUrl: "/d/shifts",
        channels: ["push", "email"],
        payload: { shiftId, reason: trimmedReason },
      });
    } catch (err) {
      console.error("[cancelShift] notify failed:", err);
    }
  }

  return { ok: true };
}
