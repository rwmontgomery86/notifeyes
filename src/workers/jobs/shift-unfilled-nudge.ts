/**
 * Concierge status ping (practice side): nudge a practice when a shift they
 * posted is approaching its start time with ZERO applicants, so they can boost
 * the rate or tweak the details before it's too late.
 *
 * Opt-in only — fires for practices whose posting user has `conciergeOptedIn`.
 *
 * Timing: shift starts 2–24h out (close enough to matter, far enough to still
 * act). Fires once per shift; dedup keyed on the notifications row
 * (kind='shift_unfilled' + payload.shiftId).
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications, shifts, users } from "@/db/schema";
import { dispatchNotification } from "@/lib/notifications";
import { formatShiftWhen } from "@/lib/dates";

export async function shiftUnfilledNudgeScan(): Promise<void> {
  const candidates = await db
    .select({
      shiftId: shifts.id,
      startsAt: shifts.startsAt,
      endsAt: shifts.endsAt,
      practiceUserId: users.id,
      practiceEmail: users.email,
      practicePhone: users.phone,
    })
    .from(shifts)
    .innerJoin(users, eq(users.id, shifts.postedByUserId))
    .where(
      and(
        eq(shifts.status, "posted"),
        eq(users.conciergeOptedIn, true),
        sql`${shifts.startsAt} BETWEEN now() + interval '2 hours' AND now() + interval '24 hours'`,
        sql`NOT EXISTS (SELECT 1 FROM applications WHERE applications.shift_id = ${shifts.id})`,
      ),
    );

  for (const c of candidates) {
    // Dedup — only one nudge per shift.
    const [already] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, c.practiceUserId),
          eq(notifications.kind, "shift_unfilled"),
          sql`${notifications.payload}->>'shiftId' = ${c.shiftId}`,
        ),
      )
      .limit(1);
    if (already) continue;

    await dispatchNotification({
      kind: "shift_unfilled",
      userId: c.practiceUserId,
      recipientEmail: c.practiceEmail,
      recipientPhone: c.practicePhone ?? undefined,
      subject: "Your shift still needs an OD",
      body: `${formatShiftWhen(c.startsAt, c.endsAt)} hasn't gotten any applicants yet. Boosting the rate or widening the details can help it get noticed.`,
      actionUrl: `/p/shifts/${c.shiftId}`,
      actionLabel: "Boost or edit",
      channels: ["push", "email"],
      payload: { shiftId: c.shiftId },
    });
  }

  if (candidates.length) {
    console.log(`[shift-unfilled-nudge] scanned ${candidates.length} candidate(s)`);
  }
}
