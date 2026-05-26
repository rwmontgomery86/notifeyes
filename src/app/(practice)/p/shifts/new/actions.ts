"use server";

import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { shifts } from "@/db/schema";
import { requirePractice } from "@/lib/auth/guards";
import { enqueueFanoutShiftPosted } from "@/lib/queue";
import { countOdsMatchingShift } from "@/lib/matching";
import { getOptInState, hasAnyNotificationChannel } from "@/lib/notifications/optIn";
import { BUMP_RADIUS_METERS } from "@/lib/bump";

const schema = z.object({
  action: z.enum(["draft", "post"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  lunchMinutes: z.coerce.number().int().min(0).max(180),
  type: z.enum(["fill_in", "half_day", "weekend"]),
  ratePerHour: z.coerce.number().int().min(20).max(1000),
  bumpRatePerHour: z.coerce.number().int().min(0).max(1000).optional(),
  notesForOd: z.string().max(2000).optional(),
});

export async function createShift(formData: FormData) {
  const session = await requirePractice();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const v = parsed.data;

  const startsAt = new Date(`${v.date}T${v.startTime}:00`);
  const endsAt = new Date(`${v.date}T${v.endTime}:00`);
  if (endsAt.getTime() <= startsAt.getTime()) {
    return { ok: false as const, error: "End time must be after start time." };
  }

  const willPost = v.action === "post";

  // Posting gate: an unreachable practice owner == broken loop.
  if (willPost) {
    const optIn = await getOptInState(session.user.id);
    if (!optIn || !hasAnyNotificationChannel(optIn)) {
      return {
        ok: false as const,
        error:
          "Add a phone or enable email notifications in Settings before posting.",
        redirectTo: "/p/settings#contact",
      };
    }
  }

  const bumpEnabled = (v.bumpRatePerHour ?? 0) > v.ratePerHour;

  const [row] = await db
    .insert(shifts)
    .values({
      practiceId: session.user.practiceId!,
      postedByUserId: session.user.id,
      startsAt,
      endsAt,
      lunchMinutes: v.lunchMinutes,
      type: v.type,
      rateCentsPerHour: v.ratePerHour * 100,
      bumpRateCentsPerHour: bumpEnabled ? v.bumpRatePerHour! * 100 : null,
      bumpRadiusMeters: bumpEnabled ? BUMP_RADIUS_METERS : null,
      bumpedAt: bumpEnabled ? sql`now()` : null,
      notesForOd: v.notesForOd || null,
      status: willPost ? "posted" : "draft",
      postedAt: willPost ? sql`now()` : null,
    })
    .returning({ id: shifts.id });

  if (willPost) {
    try {
      await enqueueFanoutShiftPosted(row.id);
    } catch (err) {
      console.error("[shift:new] enqueue fanout failed:", err);
    }
  }

  return { ok: true as const, shiftId: row.id };
}

/**
 * Reach estimate for the post-shift form. Strict match: respects price, day,
 * time window, and shift type. Returns total + bumped-only counts.
 */
export async function previewReach(input: {
  date: string;
  startTime: string;
  endTime: string;
  type: "fill_in" | "half_day" | "weekend";
  ratePerHour: number;
  bumpRatePerHour?: number | null;
}): Promise<
  { ok: true; count: number; bumpedCount: number } | { ok: false; error: string }
> {
  const session = await requirePractice();
  const practiceId = session.user.practiceId;
  if (!practiceId) return { ok: false as const, error: "No practice." };

  if (
    !input.date ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    !/^\d{2}:\d{2}$/.test(input.startTime) ||
    !/^\d{2}:\d{2}$/.test(input.endTime) ||
    !Number.isFinite(input.ratePerHour) ||
    input.ratePerHour <= 0
  ) {
    return { ok: false as const, error: "Incomplete shift details" };
  }

  const startsAt = new Date(`${input.date}T${input.startTime}:00`);
  const endsAt = new Date(`${input.date}T${input.endTime}:00`);
  if (endsAt.getTime() <= startsAt.getTime()) {
    return { ok: false as const, error: "End time must be after start time" };
  }

  const bumpEnabled =
    input.bumpRatePerHour != null && input.bumpRatePerHour > input.ratePerHour;
  const effectiveRateCents = bumpEnabled
    ? input.bumpRatePerHour! * 100
    : input.ratePerHour * 100;

  const result = await countOdsMatchingShift({
    practiceId,
    startsAt,
    endsAt,
    shiftType: input.type,
    rateCentsPerHour: effectiveRateCents,
    bumpRadiusMeters: bumpEnabled ? BUMP_RADIUS_METERS : null,
  });

  return { ok: true as const, count: result.count, bumpedCount: result.bumpedCount };
}
