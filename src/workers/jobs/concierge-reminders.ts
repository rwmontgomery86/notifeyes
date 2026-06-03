/**
 * Concierge extra: a same-day "your shift is coming up" heads-up that includes
 * the practice ADDRESS, sent to ODs who opted into concierge updates.
 *
 * This is the proactive nicety on top of the default 24h / 1h key-moment
 * reminders (see shift-reminders.ts) — the address is the value-add so the OD
 * can plan their commute. Only ODs with `conciergeOptedIn` receive it.
 *
 * Timing: we fire once when the shift is between ~2h and ~14h away. That window
 * lands the message the evening before / morning of without colliding with the
 * 1h reminder, and is timezone-robust (no per-user TZ to reason about). Dedup
 * is keyed on the notifications row: kind='shift_reminder' + payload.bookingId
 * + payload.window='morning_of'. We reuse the `shift_reminder` kind so the
 * existing in-app inbox / live-toast display handles it with no new mapping.
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  notifications,
  optometrists,
  practices,
  shifts,
  users,
} from "@/db/schema";
import { dispatchNotification } from "@/lib/notifications";
import { formatShiftWhen } from "@/lib/dates";
import { formatAddress } from "@/lib/address";

const WINDOW = "morning_of";

export async function conciergeRemindersScan(): Promise<void> {
  const candidates = await db
    .select({
      bookingId: bookings.id,
      shiftId: shifts.id,
      startsAt: shifts.startsAt,
      endsAt: shifts.endsAt,
      practiceName: practices.name,
      addressLine: practices.addressLine,
      city: practices.city,
      state: practices.state,
      zip: practices.zip,
      odUserId: users.id,
      odEmail: users.email,
      odPhone: users.phone,
    })
    .from(bookings)
    .innerJoin(shifts, eq(shifts.id, bookings.shiftId))
    .innerJoin(practices, eq(practices.id, bookings.practiceId))
    .innerJoin(optometrists, eq(optometrists.id, bookings.odId))
    .innerJoin(users, eq(users.odId, bookings.odId))
    .where(
      and(
        eq(bookings.status, "confirmed"),
        eq(users.conciergeOptedIn, true),
        sql`${shifts.startsAt} BETWEEN now() + interval '2 hours' AND now() + interval '14 hours'`,
      ),
    );

  for (const c of candidates) {
    // Dedup — only one morning-of per booking.
    const [already] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, c.odUserId),
          eq(notifications.kind, "shift_reminder"),
          sql`${notifications.payload}->>'bookingId' = ${c.bookingId}`,
          sql`${notifications.payload}->>'window' = ${WINDOW}`,
        ),
      )
      .limit(1);
    if (already) continue;

    const address = formatAddress(c);
    const body =
      `${formatShiftWhen(c.startsAt, c.endsAt)} at ${c.practiceName}.` +
      (address ? `\nWhere: ${address}` : "");

    await dispatchNotification({
      kind: "shift_reminder",
      userId: c.odUserId,
      recipientEmail: c.odEmail,
      recipientPhone: c.odPhone ?? undefined,
      subject: `Your shift at ${c.practiceName} is coming up`,
      body,
      actionUrl: `/bookings/${c.bookingId}`,
      actionLabel: "View booking",
      channels: ["push", "email"],
      payload: { bookingId: c.bookingId, shiftId: c.shiftId, window: WINDOW },
    });
  }

  if (candidates.length) {
    console.log(`[concierge-reminders] scanned ${candidates.length} candidate(s)`);
  }
}
