import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Daily cron — delete password-reset rows that can no longer be redeemed.
 *
 * Rows linger 24h past expiry rather than vanishing the moment they expire,
 * so a "my link says expired" support complaint can still be checked against
 * the row. Used rows carry the same expires_at clock, so one predicate
 * covers both. The 1h rate-limit window in src/lib/password-reset.ts counts
 * rows far younger than this cutoff, so purging never loosens the limit.
 */
export async function purgePasswordResets(): Promise<void> {
  const res = await db.execute(sql`
    DELETE FROM password_resets
    WHERE expires_at < now() - interval '24 hours';
  `);
  console.log(`[password-resets:cron] purged ${res.rowCount ?? 0} stale row(s)`);
}
