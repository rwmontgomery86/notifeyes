/**
 * Watch-zone matching engine.
 *
 * Given a newly-posted Shift, find every WatchZone whose:
 *   1. Geometry contains the Practice location (PostGIS ST_Contains)
 *   2. min_rate_cents <= shift.rate
 *   3. days_of_week includes the shift's day
 *   4. time window (HH:MM start/end) overlaps the shift hours
 *   5. shift_types includes the shift's type
 *   6. NOT paused
 *
 * Returns the matching OD user_ids (the rows are joined back through
 * optometrists → users so the caller can write Notification rows directly).
 */

import { sql } from "drizzle-orm";
import { db } from "@/db";

export interface MatchedOd {
  watchZoneId: string;
  odId: string;
  userId: string;
  zoneName: string;
  channels: ("push" | "email" | "sms")[];
}

export async function findOdsMatchingShift(shiftId: string): Promise<MatchedOd[]> {
  // We use raw SQL because we want one round-trip and use PostGIS predicates.
  const result = await db.execute<{
    watch_zone_id: string;
    od_id: string;
    user_id: string;
    zone_name: string;
    notify_channels: ("push" | "email" | "sms")[];
  }>(sql`
    WITH s AS (
      SELECT
        sh.id AS shift_id,
        sh.practice_id,
        sh.starts_at,
        sh.ends_at,
        sh.rate_cents_per_hour,
        sh.type::text AS shift_type,
        p.location AS practice_location,
        EXTRACT(DOW FROM sh.starts_at AT TIME ZONE 'UTC')::int AS dow,
        TO_CHAR(sh.starts_at AT TIME ZONE 'UTC', 'HH24:MI') AS starts_hhmm,
        TO_CHAR(sh.ends_at AT TIME ZONE 'UTC', 'HH24:MI') AS ends_hhmm
      FROM shifts sh
      JOIN practices p ON p.id = sh.practice_id
      WHERE sh.id = ${shiftId}
    )
    SELECT
      wz.id AS watch_zone_id,
      wz.od_id,
      u.id AS user_id,
      wz.name AS zone_name,
      wz.notify_channels
    FROM watch_zones wz
    JOIN s ON TRUE
    JOIN optometrists o ON o.id = wz.od_id
    JOIN users u ON u.od_id = o.id
    WHERE NOT wz.paused
      AND ST_Contains(wz.geometry::geometry, s.practice_location::geometry)
      AND wz.min_rate_cents <= s.rate_cents_per_hour
      AND wz.days_of_week::jsonb @> to_jsonb(s.dow)
      AND wz.shift_types::jsonb @> to_jsonb(s.shift_type)
      AND (wz.time_start IS NULL OR wz.time_start <= s.starts_hhmm)
      AND (wz.time_end   IS NULL OR wz.time_end   >= s.ends_hhmm)
      AND o.verification_status = 'verified'
      AND NOT EXISTS (
        SELECT 1 FROM od_practice_blocks opb
        WHERE opb.od_id = wz.od_id AND opb.practice_id = s.practice_id
      );
  `);

  return result.rows.map((r) => ({
    watchZoneId: r.watch_zone_id,
    odId: r.od_id,
    userId: r.user_id,
    zoneName: r.zone_name,
    channels: r.notify_channels,
  }));
}
