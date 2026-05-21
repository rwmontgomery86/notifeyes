import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Hourly cron — publish blind reviews older than 7 days.
 *
 * Per §6F: reviews stay blind until both sides submit OR 7 days pass,
 * whichever is first. The both-sides case is handled inline in the review
 * submit action; this cron picks up the "only one side wrote" stragglers.
 *
 * After publish, rating aggregates on the relevant Practice or Optometrist
 * row are recomputed.
 */
export async function publishPendingReviews(): Promise<void> {
  // Find affected practices + ODs first, then publish, then rebuild aggregates
  const affected = await db.execute<{ practice_id: string; od_id: string }>(sql`
    SELECT DISTINCT b.practice_id, b.od_id
    FROM reviews r
    JOIN bookings b ON b.id = r.booking_id
    WHERE r.published_at IS NULL
      AND r.created_at < now() - interval '7 days';
  `);

  if (affected.rows.length === 0) {
    console.log("[reviews:cron] no stragglers");
    return;
  }

  await db.execute(sql`
    UPDATE reviews
    SET published_at = now()
    WHERE published_at IS NULL
      AND created_at < now() - interval '7 days';
  `);

  // Rebuild aggregates for affected ODs
  const odIds = Array.from(new Set(affected.rows.map((r) => r.od_id)));
  for (const odId of odIds) {
    await db.execute(sql`
      UPDATE optometrists o
      SET
        rating_avg = stats.avg,
        rating_count = stats.cnt
      FROM (
        SELECT
          AVG(r.rating_overall)::real AS avg,
          COUNT(*)::int AS cnt
        FROM reviews r
        JOIN bookings b ON b.id = r.booking_id
        WHERE r.author_role = 'practice'
          AND r.published_at IS NOT NULL
          AND b.od_id = ${odId}
      ) AS stats
      WHERE o.id = ${odId};
    `);
  }

  const practiceIds = Array.from(new Set(affected.rows.map((r) => r.practice_id)));
  for (const pid of practiceIds) {
    await db.execute(sql`
      UPDATE practices p
      SET
        rating_avg = stats.avg,
        rating_count = stats.cnt
      FROM (
        SELECT
          AVG(r.rating_overall)::real AS avg,
          COUNT(*)::int AS cnt
        FROM reviews r
        JOIN bookings b ON b.id = r.booking_id
        WHERE r.author_role = 'od'
          AND r.published_at IS NOT NULL
          AND b.practice_id = ${pid}
      ) AS stats
      WHERE p.id = ${pid};
    `);
  }

  console.log(`[reviews:cron] published stragglers · ${odIds.length} ODs / ${practiceIds.length} practices`);
}
