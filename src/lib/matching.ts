/**
 * Watch-zone matching engine.
 *
 * Given a newly-posted Shift, find every WatchZone whose:
 *   1. Geometry contains the Practice location (PostGIS ST_Contains),
 *      OR — if the shift is boosted — the zone is within bump_radius_meters
 *      of the practice (ST_DWithin on geography → meters).
 *   2. min_rate_cents <= shift.effective rate (bump rate when set, else base)
 *   3. days_of_week includes the shift's day
 *   4. time window (HH:MM start/end) overlaps the shift hours
 *   5. shift_types includes the shift's type
 *   6. NOT paused
 *
 * Returns the matching OD user_ids (the rows are joined back through
 * optometrists → users so the caller can write Notification rows directly).
 *
 * `matchKind` distinguishes "contains" (zone surrounded the practice) from
 * "bumped" (zone didn't, but the practice paid extra to reach outward).
 */

import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export type MatchKind = "contains" | "bumped";

export interface MatchedOd {
  watchZoneId: string;
  odId: string;
  userId: string;
  zoneName: string;
  channels: ("push" | "email" | "sms")[];
  matchKind: MatchKind;
}

export async function findOdsMatchingShift(shiftId: string): Promise<MatchedOd[]> {
  // We use raw SQL because we want one round-trip and use PostGIS predicates.
  const result = await db.execute<{
    watch_zone_id: string;
    od_id: string;
    user_id: string;
    zone_name: string;
    notify_channels: ("push" | "email" | "sms")[];
    match_kind: MatchKind;
  }>(sql`
    WITH s AS (
      SELECT
        sh.id AS shift_id,
        sh.practice_id,
        sh.starts_at,
        sh.ends_at,
        COALESCE(sh.bump_rate_cents_per_hour, sh.rate_cents_per_hour) AS effective_rate_cents,
        sh.bump_radius_meters,
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
      wz.notify_channels,
      CASE WHEN ST_Contains(wz.geometry::geometry, s.practice_location::geometry)
           THEN 'contains' ELSE 'bumped' END AS match_kind
    FROM watch_zones wz
    JOIN s ON TRUE
    JOIN optometrists o ON o.id = wz.od_id
    JOIN users u ON u.od_id = o.id
    WHERE NOT wz.paused
      AND (
        ST_Contains(wz.geometry::geometry, s.practice_location::geometry)
        OR (
          s.bump_radius_meters IS NOT NULL
          AND ST_DWithin(wz.geometry, s.practice_location, s.bump_radius_meters)
        )
      )
      AND wz.min_rate_cents <= s.effective_rate_cents
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
    matchKind: r.match_kind,
  }));
}

export interface CountOdsInput {
  practiceId: string;
  startsAt: Date;
  endsAt: Date;
  shiftType: "fill_in" | "half_day" | "weekend" | "recurring" | "permanent";
  /** Effective hourly rate in cents (use bump rate when bumped, else base). */
  rateCentsPerHour: number;
  /** When set, also include ODs whose zone is within this many meters of the practice. */
  bumpRadiusMeters?: number | null;
}

export interface CountOdsResult {
  count: number;
  bumpedCount: number;
}

/**
 * Cheap COUNT(*) variant of the matching query for "reach estimate" UIs.
 * Doesn't require the shift to be inserted yet — caller passes tentative fields.
 *
 * Returns total matching ODs and how many of those were matched only via the
 * bump branch (so the UI can render "27 watching · 5 added by bump").
 */
export async function countOdsMatchingShift(
  input: CountOdsInput,
): Promise<CountOdsResult> {
  const bumpRadius = input.bumpRadiusMeters ?? null;
  const result = await db.execute<{ total: string | number; bumped: string | number }>(sql`
    WITH s AS (
      SELECT
        p.location AS practice_location,
        ${input.rateCentsPerHour}::int AS effective_rate_cents,
        ${bumpRadius}::int AS bump_radius_meters,
        ${input.shiftType}::text AS shift_type,
        EXTRACT(DOW FROM ${input.startsAt.toISOString()}::timestamptz AT TIME ZONE 'UTC')::int AS dow,
        TO_CHAR(${input.startsAt.toISOString()}::timestamptz AT TIME ZONE 'UTC', 'HH24:MI') AS starts_hhmm,
        TO_CHAR(${input.endsAt.toISOString()}::timestamptz AT TIME ZONE 'UTC', 'HH24:MI') AS ends_hhmm
      FROM practices p
      WHERE p.id = ${input.practiceId}
    ),
    matches AS (
      SELECT DISTINCT
        wz.od_id,
        CASE WHEN ST_Contains(wz.geometry::geometry, s.practice_location::geometry)
             THEN 'contains' ELSE 'bumped' END AS match_kind
      FROM watch_zones wz
      JOIN s ON TRUE
      JOIN optometrists o ON o.id = wz.od_id
      WHERE NOT wz.paused
        AND (
          ST_Contains(wz.geometry::geometry, s.practice_location::geometry)
          OR (
            s.bump_radius_meters IS NOT NULL
            AND ST_DWithin(wz.geometry, s.practice_location, s.bump_radius_meters)
          )
        )
        AND wz.min_rate_cents <= s.effective_rate_cents
        AND wz.days_of_week::jsonb @> to_jsonb(s.dow)
        AND wz.shift_types::jsonb @> to_jsonb(s.shift_type)
        AND (wz.time_start IS NULL OR wz.time_start <= s.starts_hhmm)
        AND (wz.time_end   IS NULL OR wz.time_end   >= s.ends_hhmm)
        AND o.verification_status = 'verified'
    )
    SELECT
      COUNT(DISTINCT od_id)::int AS total,
      COUNT(DISTINCT od_id) FILTER (
        WHERE od_id NOT IN (SELECT od_id FROM matches WHERE match_kind = 'contains')
      )::int AS bumped
    FROM matches;
  `);

  const row = result.rows[0];
  if (!row) return { count: 0, bumpedCount: 0 };
  return {
    count: Number(row.total) || 0,
    bumpedCount: Number(row.bumped) || 0,
  };
}
