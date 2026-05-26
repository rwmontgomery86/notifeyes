"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { shifts } from "@/db/schema";
import { requirePractice } from "@/lib/auth/guards";
import { enqueueFanoutShiftPosted } from "@/lib/queue";
import { assertShiftTransition } from "@/lib/state/shift";
import { getOptInState, hasAnyNotificationChannel } from "@/lib/notifications/optIn";

const updateSchema = z.object({
  action: z.enum(["draft", "post"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  lunchMinutes: z.coerce.number().int().min(0).max(180),
  type: z.enum(["fill_in", "half_day", "weekend"]),
  ratePerHour: z.coerce.number().int().min(20).max(1000),
  notesForOd: z.string().max(2000).optional(),
});

async function loadOwnedShift(shiftId: string) {
  const session = await requirePractice();
  const [row] = await db
    .select()
    .from(shifts)
    .where(eq(shifts.id, shiftId))
    .limit(1);
  if (!row) return { ok: false as const, error: "Shift not found" };
  if (row.practiceId !== session.user.practiceId && session.user.role !== "admin") {
    return { ok: false as const, error: "Forbidden" };
  }
  return { ok: true as const, shift: row };
}

export async function updateShift(shiftId: string, formData: FormData) {
  const owned = await loadOwnedShift(shiftId);
  if (!owned.ok) return owned;
  if (owned.shift.status !== "draft") {
    return { ok: false as const, error: "Only drafts can be edited." };
  }

  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
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
  if (willPost) {
    assertShiftTransition("draft", "posted");
    const session = await requirePractice();
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

  await db
    .update(shifts)
    .set({
      startsAt,
      endsAt,
      lunchMinutes: v.lunchMinutes,
      type: v.type,
      rateCentsPerHour: v.ratePerHour * 100,
      notesForOd: v.notesForOd || null,
      ...(willPost ? { status: "posted" as const, postedAt: sql`now()` } : {}),
    })
    .where(and(eq(shifts.id, shiftId), eq(shifts.status, "draft")));

  if (willPost) {
    try {
      await enqueueFanoutShiftPosted(shiftId);
    } catch (err) {
      console.error("[shift:edit] enqueue fanout failed:", err);
    }
  }

  return { ok: true as const, shiftId, posted: willPost };
}

export async function postShiftDraft(shiftId: string) {
  const owned = await loadOwnedShift(shiftId);
  if (!owned.ok) return owned;
  if (owned.shift.status !== "draft") {
    return { ok: false as const, error: "Only drafts can be posted." };
  }
  assertShiftTransition("draft", "posted");
  const session = await requirePractice();
  const optIn = await getOptInState(session.user.id);
  if (!optIn || !hasAnyNotificationChannel(optIn)) {
    return {
      ok: false as const,
      error:
        "Add a phone or enable email notifications in Settings before posting.",
      redirectTo: "/p/settings#contact",
    };
  }

  const updated = await db
    .update(shifts)
    .set({ status: "posted", postedAt: sql`now()` })
    .where(and(eq(shifts.id, shiftId), eq(shifts.status, "draft")))
    .returning({ id: shifts.id });

  if (updated.length === 0) {
    return { ok: false as const, error: "Shift was no longer a draft." };
  }

  try {
    await enqueueFanoutShiftPosted(shiftId);
  } catch (err) {
    console.error("[shift:post-draft] enqueue fanout failed:", err);
  }

  return { ok: true as const, shiftId };
}

export async function deleteShiftDraft(shiftId: string) {
  const owned = await loadOwnedShift(shiftId);
  if (!owned.ok) return owned;
  if (owned.shift.status !== "draft") {
    return { ok: false as const, error: "Only drafts can be deleted." };
  }

  const deleted = await db
    .delete(shifts)
    .where(and(eq(shifts.id, shiftId), eq(shifts.status, "draft")))
    .returning({ id: shifts.id });

  if (deleted.length === 0) {
    return { ok: false as const, error: "Shift was no longer a draft." };
  }
  return { ok: true as const };
}
