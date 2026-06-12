import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications, practices, shifts, users } from "@/db/schema";
import { findOdsMatchingShift } from "@/lib/matching";
import { dispatchNotification } from "@/lib/notifications";
import { formatShiftWhen } from "@/lib/dates";
import { formatUsd } from "@/lib/pricing";
import { log } from "../log";

export interface FanoutShiftBumpedData {
  shiftId: string;
}

/**
 * Triggered when a practice boosts an unfilled shift. Finds every OD who
 * matches the bumped shift NOW but did NOT receive a `watch_match` notification
 * before — and notifies only that delta. Skipping previously-notified ODs
 * prevents alert spam when a shift is bumped after initial fanout.
 */
export async function fanoutShiftBumped(
  data: FanoutShiftBumpedData,
): Promise<void> {
  const [row] = await db
    .select({ shift: shifts, practice: practices })
    .from(shifts)
    .innerJoin(practices, eq(shifts.practiceId, practices.id))
    .where(eq(shifts.id, data.shiftId))
    .limit(1);
  if (!row) {
    log.warn("fanout_bump.shift_not_found", { shiftId: data.shiftId });
    return;
  }
  if (row.shift.status !== "posted") {
    log.info("fanout_bump.skipped", {
      shiftId: data.shiftId,
      reason: "not_posted",
      status: row.shift.status,
    });
    return;
  }
  if (row.shift.bumpedAt == null) {
    log.info("fanout_bump.skipped", {
      shiftId: data.shiftId,
      reason: "no_bumped_at",
    });
    return;
  }

  const allMatches = await findOdsMatchingShift(data.shiftId);

  const alreadyRows = await db.execute<{ user_id: string }>(sql`
    SELECT DISTINCT user_id
    FROM notifications
    WHERE kind = 'watch_match'
      AND payload->>'shiftId' = ${data.shiftId}
  `);
  const already = new Set(alreadyRows.rows.map((r) => r.user_id));
  const delta = allMatches.filter((m) => !already.has(m.userId));

  log.info("fanout_bump.matched", {
    shiftId: data.shiftId,
    total: allMatches.length,
    fresh: delta.length,
  });
  if (delta.length === 0) return;

  const effectiveRate =
    row.shift.bumpRateCentsPerHour ?? row.shift.rateCentsPerHour;
  const subject = `${row.practice.name} boosted a shift near you`;
  const body =
    `${formatShiftWhen(row.shift.startsAt, row.shift.endsAt)}\n` +
    `${formatUsd(effectiveRate)}/hr · ${row.practice.city}, ${row.practice.state}`;
  const actionUrl = `/shifts/${row.shift.id}`;

  const userRows = await db
    .select({ id: users.id, email: users.email, phone: users.phone })
    .from(users)
    .where(inArray(users.id, delta.map((m) => m.userId)));
  const userMap = new Map(userRows.map((u) => [u.id, u]));

  const BATCH = 20;
  for (let i = 0; i < delta.length; i += BATCH) {
    const slice = delta.slice(i, i + BATCH);
    await Promise.all(
      slice.map((m) => {
        const u = userMap.get(m.userId);
        return dispatchNotification({
          kind: "watch_match",
          userId: m.userId,
          recipientEmail: u?.email,
          recipientPhone: u?.phone ?? undefined,
          subject,
          body:
            m.matchKind === "bumped"
              ? `${body}\n\nOutside your zone "${m.zoneName}" — the practice paid a boost to surface it to you.`
              : `${body}\n\nMatched your watch zone "${m.zoneName}".`,
          actionUrl,
          channels: m.channels,
          payload: {
            shiftId: row.shift.id,
            practiceId: row.practice.id,
            watchZoneId: m.watchZoneId,
            matchKind: m.matchKind,
            viaBoost: true,
          },
        });
      }),
    );
  }
}
