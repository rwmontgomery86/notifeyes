/**
 * Send shift_reminder notifications to both sides at the 24h and 1h marks.
 *
 * The brief lists two windows in §7:
 *   shift_reminder · 24h before · 1h before
 *
 * Implementation: every 5 min, find confirmed bookings whose shift starts
 * within a generous window around 24h or 1h from now, and haven't already
 * been sent a reminder for that window. Window dedup is keyed by
 * `payload.window` on the notifications row.
 *
 * "Generous window" = within ±15 min of the target, which absorbs any
 * jitter from the 5-minute scan cadence.
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
import { log } from "../log";

type Window = "24h" | "1h";

const WINDOWS: { window: Window; offset: string; label: string }[] = [
  { window: "24h", offset: "24 hours", label: "tomorrow" },
  { window: "1h", offset: "1 hour", label: "in an hour" },
];

export async function shiftRemindersScan(): Promise<void> {
  for (const w of WINDOWS) {
    // Find confirmed bookings whose shift start time falls within ±15 min
    // of (now() + offset).
    const candidates = await db
      .select({
        bookingId: bookings.id,
        shiftId: shifts.id,
        startsAt: shifts.startsAt,
        endsAt: shifts.endsAt,
        rateCentsPerHour: shifts.rateCentsPerHour,
        postedByUserId: shifts.postedByUserId,
        odId: bookings.odId,
        practiceName: practices.name,
        odName: optometrists.name,
      })
      .from(bookings)
      .innerJoin(shifts, eq(shifts.id, bookings.shiftId))
      .innerJoin(practices, eq(practices.id, bookings.practiceId))
      .innerJoin(optometrists, eq(optometrists.id, bookings.odId))
      .where(
        and(
          eq(bookings.status, "confirmed"),
          sql`${shifts.startsAt} BETWEEN now() + interval '${sql.raw(w.offset)}' - interval '15 minutes' AND now() + interval '${sql.raw(w.offset)}' + interval '15 minutes'`,
        ),
      );

    for (const c of candidates) {
      // OD user lookup
      const [odUser] = await db
        .select({ id: users.id, email: users.email, phone: users.phone })
        .from(users)
        .where(eq(users.odId, c.odId))
        .limit(1);
      const [practiceUser] = await db
        .select({ email: users.email, phone: users.phone })
        .from(users)
        .where(eq(users.id, c.postedByUserId))
        .limit(1);

      // For each side, dedup independently.
      const recipients = [
        odUser
          ? {
              userId: odUser.id,
              email: odUser.email,
              phone: odUser.phone ?? undefined,
              counterparty: c.practiceName,
            }
          : null,
        {
          userId: c.postedByUserId,
          email: practiceUser?.email,
          phone: practiceUser?.phone ?? undefined,
          counterparty: c.odName,
        },
      ].filter((r): r is NonNullable<typeof r> => r !== null);

      for (const r of recipients) {
        const [already] = await db
          .select({ id: notifications.id })
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, r.userId),
              eq(notifications.kind, "shift_reminder"),
              sql`${notifications.payload}->>'bookingId' = ${c.bookingId}`,
              sql`${notifications.payload}->>'window' = ${w.window}`,
            ),
          )
          .limit(1);
        if (already) continue;

        await dispatchNotification({
          kind: "shift_reminder",
          userId: r.userId,
          recipientEmail: r.email,
          recipientPhone: r.phone,
          subject: `Reminder: shift with ${r.counterparty} ${w.label}`,
          body: `${formatShiftWhen(c.startsAt, c.endsAt)}.`,
          actionUrl: `/bookings/${c.bookingId}`,
          // 24h: push + email; 1h: push + email + sms (more urgent)
          channels: w.window === "1h" ? ["push", "email", "sms"] : ["push", "email"],
          payload: { bookingId: c.bookingId, shiftId: c.shiftId, window: w.window },
        });
      }
    }

    if (candidates.length) {
      log.info("shift_reminders.scanned", {
        window: w.window,
        bookings: candidates.length,
      });
    }
  }
}
