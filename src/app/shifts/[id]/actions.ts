"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { applications, optometrists, practices, shifts, users } from "@/db/schema";
import { requireVerifiedOd } from "@/lib/auth/guards";
import { dispatchNotification } from "@/lib/notifications";
import { formatShiftWhen } from "@/lib/dates";
import { formatUsd } from "@/lib/pricing";

const schema = z.object({
  message: z.string().max(1000).optional(),
});

export async function applyToShift(shiftId: string, message: string) {
  const session = await requireVerifiedOd();
  const parsed = schema.safeParse({ message });
  if (!parsed.success) {
    return { ok: false as const, error: "Message too long." };
  }
  const odId = session.user.odId!;

  // Confirm shift is still posted
  const [shift] = await db
    .select({ status: shifts.status })
    .from(shifts)
    .where(eq(shifts.id, shiftId))
    .limit(1);
  if (!shift) return { ok: false as const, error: "Shift not found." };
  if (shift.status !== "posted") {
    return { ok: false as const, error: "This shift is no longer accepting applications." };
  }

  // Guard against duplicate application (unique index will also enforce this)
  const [existing] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.shiftId, shiftId), eq(applications.odId, odId)))
    .limit(1);
  if (existing) {
    return { ok: false as const, error: "You've already applied to this shift." };
  }

  await db.insert(applications).values({
    shiftId,
    odId,
    source: "apply",
    message: parsed.data.message || null,
    status: "applied",
  });

  // Notify the practice user who posted the shift
  try {
    const [ctx] = await db
      .select({
        practiceName: practices.name,
        startsAt: shifts.startsAt,
        endsAt: shifts.endsAt,
        rateCentsPerHour: shifts.rateCentsPerHour,
        postedByUserId: shifts.postedByUserId,
        odName: optometrists.name,
        practiceUserEmail: users.email,
      })
      .from(shifts)
      .innerJoin(practices, eq(practices.id, shifts.practiceId))
      .innerJoin(optometrists, eq(optometrists.id, odId))
      .innerJoin(users, eq(users.id, shifts.postedByUserId))
      .where(eq(shifts.id, shiftId))
      .limit(1);
    if (ctx) {
      await dispatchNotification({
        kind: "new_applicant",
        userId: ctx.postedByUserId,
        recipientEmail: ctx.practiceUserEmail,
        subject: `${ctx.odName} applied to your ${formatUsd(ctx.rateCentsPerHour)}/hr shift`,
        body: `${formatShiftWhen(ctx.startsAt, ctx.endsAt)} · review and book on the shift page.`,
        actionUrl: `/p/shifts/${shiftId}`,
        channels: ["push", "email"],
        payload: { shiftId, odId },
      });
    }
  } catch (err) {
    console.error("[apply] notification dispatch failed:", err);
  }

  return { ok: true as const };
}
