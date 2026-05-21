"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bookings, reviews } from "@/db/schema";
import { requireSession } from "@/lib/auth/guards";

const schema = z.object({
  bookingId: z.string().uuid(),
  ratingOverall: z.number().int().min(1).max(5),
  ratingSpecifics: z.record(z.string(), z.number().int().min(1).max(5)),
  publicComment: z.string().max(1000).nullable().optional(),
  privateFeedback: z.string().max(1000).nullable().optional(),
});

export async function submitReview(input: z.infer<typeof schema>) {
  const session = await requireSession();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, v.bookingId))
    .limit(1);
  if (!booking) return { ok: false as const, error: "Booking not found" };
  if (booking.status !== "completed") {
    return { ok: false as const, error: "Reviews open only after the shift is completed." };
  }

  const isPractice = session.user.practiceId === booking.practiceId;
  const isOd = session.user.odId === booking.odId;
  if (!isPractice && !isOd) {
    return { ok: false as const, error: "Forbidden" };
  }
  const authorRole = isPractice ? "practice" : "od";

  let bothSubmitted = false;
  await db.transaction(async (tx) => {
    // Upsert — one review per (booking, author_role)
    await tx
      .insert(reviews)
      .values({
        bookingId: v.bookingId,
        authorRole,
        authorUserId: session.user.id,
        ratingOverall: v.ratingOverall,
        ratingSpecifics: v.ratingSpecifics,
        publicComment: v.publicComment ?? null,
        privateFeedback: v.privateFeedback ?? null,
      })
      .onConflictDoUpdate({
        target: [reviews.bookingId, reviews.authorRole],
        set: {
          ratingOverall: v.ratingOverall,
          ratingSpecifics: v.ratingSpecifics,
          publicComment: v.publicComment ?? null,
          privateFeedback: v.privateFeedback ?? null,
        },
      });

    // If the other side has already submitted, publish both.
    const [other] = await tx
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.bookingId, v.bookingId),
          sql`${reviews.authorRole} <> ${authorRole}`,
        ),
      )
      .limit(1);
    if (other) {
      await tx
        .update(reviews)
        .set({ publishedAt: sql`now()` })
        .where(eq(reviews.bookingId, v.bookingId));
      bothSubmitted = true;
    }
    // If no counterpart yet, leave published_at = null. The hourly cron
    // publish-pending-reviews will push it through at the 7-day mark.
  });

  if (bothSubmitted) {
    await rebuildRatingAggregates(v.bookingId);
  }

  return { ok: true as const };
}

/** Rebuild rating_avg/count on both Practice and Optometrist after publish. */
async function rebuildRatingAggregates(bookingId: string) {
  const [b] = await db
    .select({ practiceId: bookings.practiceId, odId: bookings.odId })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!b) return;

  // OD aggregates: reviews where author_role='practice' and published
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
      JOIN bookings bk ON bk.id = r.booking_id
      WHERE r.author_role = 'practice'
        AND r.published_at IS NOT NULL
        AND bk.od_id = ${b.odId}
    ) AS stats
    WHERE o.id = ${b.odId};
  `);

  // Practice aggregates: reviews where author_role='od' and published
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
      JOIN bookings bk ON bk.id = r.booking_id
      WHERE r.author_role = 'od'
        AND r.published_at IS NOT NULL
        AND bk.practice_id = ${b.practiceId}
    ) AS stats
    WHERE p.id = ${b.practiceId};
  `);
}
