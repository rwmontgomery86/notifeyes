/**
 * Periodic scan for bookings where the OD hasn't checked in 15 min after
 * the shift start. Dispatches `no_show_check` to the practice (§6E).
 *
 * The brief's flow:
 *   start + 15 min, no check-in → "Where's your OD?" ping to practice
 *   practice tries to reach OD; another 30 min grace
 *   practice reports → status='no_show'
 *
 * We only fire ONCE per booking; dedup'd by looking for an existing
 * notification row with kind='no_show_check' and payload.bookingId match.
 */

import { and, eq, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  notifications,
  shifts,
  users,
} from "@/db/schema";
import { dispatchNotification } from "@/lib/notifications";
import { formatShiftWhen } from "@/lib/dates";
import { log } from "../log";

export async function noShowCheckScan(): Promise<void> {
  // Bookings still confirmed/in_progress, shift started >=15 min ago,
  // no check-in yet, and we haven't already pinged the practice.
  const candidates = await db
    .select({
      bookingId: bookings.id,
      shiftId: shifts.id,
      practiceUserId: shifts.postedByUserId,
      startsAt: shifts.startsAt,
      endsAt: shifts.endsAt,
      practiceId: bookings.practiceId,
    })
    .from(bookings)
    .innerJoin(shifts, eq(shifts.id, bookings.shiftId))
    .where(
      and(
        sql`${bookings.status} IN ('confirmed','in_progress')`,
        isNull(bookings.checkInAt),
        lte(shifts.startsAt, sql`now() - interval '15 minutes'`),
        // Don't ping for shifts that already ended (those go through the
        // auto-progression worker → completed; practice can report no-show
        // retroactively if they really want)
        sql`${shifts.endsAt} > now()`,
      ),
    );

  for (const c of candidates) {
    // Dedup — has this booking already been pinged?
    const [already] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.kind, "no_show_check"),
          sql`${notifications.payload}->>'bookingId' = ${c.bookingId}`,
        ),
      )
      .limit(1);
    if (already) continue;

    // Resolve the practice user's email
    const [practiceUser] = await db
      .select({ email: users.email, phone: users.phone })
      .from(users)
      .where(eq(users.id, c.practiceUserId))
      .limit(1);

    await dispatchNotification({
      kind: "no_show_check",
      userId: c.practiceUserId,
      recipientEmail: practiceUser?.email,
      recipientPhone: practiceUser?.phone ?? undefined,
      subject: "Where's your OD?",
      body: `Your OD hasn't checked in for the ${formatShiftWhen(c.startsAt, c.endsAt)} shift. Try messaging or calling — if you can't reach them in 30 minutes you can report a no-show.`,
      actionUrl: `/bookings/${c.bookingId}`,
      channels: ["push", "sms", "email"],
      payload: { bookingId: c.bookingId, shiftId: c.shiftId },
    });
  }

  if (candidates.length) {
    log.info("no_show_check.scanned", { candidates: candidates.length });
  }
}
