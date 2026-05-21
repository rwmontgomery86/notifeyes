"use server";

import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { shifts } from "@/db/schema";
import { requirePractice } from "@/lib/auth/guards";
import { enqueueFanoutShiftPosted } from "@/lib/queue";

const schema = z.object({
  action: z.enum(["draft", "post"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  lunchMinutes: z.coerce.number().int().min(0).max(180),
  type: z.enum(["fill_in", "half_day", "weekend"]),
  ratePerHour: z.coerce.number().int().min(20).max(1000),
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
      notesForOd: v.notesForOd || null,
      status: willPost ? "posted" : "draft",
      postedAt: willPost ? sql`now()` : null,
    })
    .returning({ id: shifts.id });

  if (willPost) {
    // Fire-and-forget — but await briefly so any synchronous error surfaces.
    // pg-boss `send` returns quickly once the row is inserted in pgboss schema.
    try {
      await enqueueFanoutShiftPosted(row.id);
    } catch (err) {
      // Don't fail the whole post over a queue hiccup — the worker has a
      // periodic catch-up scan that picks up any 'posted' shift missing a
      // fanout notification. (Catch-up scan is V2; for V1 this just logs.)
      console.error("[shift:new] enqueue fanout failed:", err);
    }
  }

  return { ok: true as const, shiftId: row.id };
}
