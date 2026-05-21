import { eq } from "drizzle-orm";
import { db } from "@/db";
import { practices, shifts } from "@/db/schema";
import { findOdsMatchingShift } from "@/lib/matching";
import { dispatchNotification } from "@/lib/notifications";
import { formatShiftWhen } from "@/lib/dates";
import { formatUsd } from "@/lib/pricing";

export interface FanoutShiftPostedData {
  shiftId: string;
}

/**
 * Triggered when a shift transitions to status='posted'. Finds every OD whose
 * watch zone matches and dispatches a `watch_match` notification per OD across
 * their selected channels.
 *
 * Target latency (§9 of brief): notifications written within 10s of post.
 */
export async function fanoutShiftPosted(
  data: FanoutShiftPostedData,
): Promise<void> {
  const [row] = await db
    .select({ shift: shifts, practice: practices })
    .from(shifts)
    .innerJoin(practices, eq(shifts.practiceId, practices.id))
    .where(eq(shifts.id, data.shiftId))
    .limit(1);
  if (!row) {
    console.warn(`[fanout] shift ${data.shiftId} not found`);
    return;
  }
  if (row.shift.status !== "posted") {
    console.log(
      `[fanout] shift ${data.shiftId} is ${row.shift.status}, skipping fanout`,
    );
    return;
  }

  const matches = await findOdsMatchingShift(data.shiftId);
  console.log(`[fanout] shift ${data.shiftId} → ${matches.length} matching ODs`);

  const subject = `${row.practice.name} just posted a shift`;
  const body =
    `${formatShiftWhen(row.shift.startsAt, row.shift.endsAt)}\n` +
    `${formatUsd(row.shift.rateCentsPerHour)}/hr · ${row.practice.city}, ${row.practice.state}`;
  const actionUrl = `/shifts/${row.shift.id}`;

  // Look up emails for matched users in a single query
  const { users } = await import("@/db/schema");
  const { inArray } = await import("drizzle-orm");
  const userRows = matches.length
    ? await db
        .select({ id: users.id, email: users.email, phone: users.phone })
        .from(users)
        .where(inArray(users.id, matches.map((m) => m.userId)))
    : [];
  const userMap = new Map(userRows.map((u) => [u.id, u]));

  // Dispatch in parallel but cap concurrency to avoid overwhelming external APIs
  const BATCH = 20;
  for (let i = 0; i < matches.length; i += BATCH) {
    const slice = matches.slice(i, i + BATCH);
    await Promise.all(
      slice.map((m) => {
        const u = userMap.get(m.userId);
        return dispatchNotification({
          kind: "watch_match",
          userId: m.userId,
          recipientEmail: u?.email,
          recipientPhone: u?.phone ?? undefined,
          subject,
          body: `${body}\n\nMatched your watch zone "${m.zoneName}".`,
          actionUrl,
          channels: m.channels,
          payload: {
            shiftId: row.shift.id,
            practiceId: row.practice.id,
            watchZoneId: m.watchZoneId,
          },
        });
      }),
    );
  }
}
