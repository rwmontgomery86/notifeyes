"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { applications, practices, shifts, users } from "@/db/schema";
import { requirePractice } from "@/lib/auth/guards";
import {
  assertApplicationTransition,
  type ApplicationStatus,
} from "@/lib/state/application";
import { enqueueFanoutShiftBumped } from "@/lib/queue";
import { BUMP_RADIUS_METERS } from "@/lib/bump";
import { dispatchNotification } from "@/lib/notifications";
import { formatShiftWhen } from "@/lib/dates";

export async function setApplicationStatus(
  applicationId: string,
  next: string,
) {
  const session = await requirePractice();
  const allowed: ApplicationStatus[] = [
    "applied",
    "shortlisted",
    "offered",
    "accepted",
    "declined",
    "withdrawn",
  ];
  if (!allowed.includes(next as ApplicationStatus)) {
    throw new Error("Invalid status");
  }

  const [app] = await db
    .select({
      id: applications.id,
      shiftId: applications.shiftId,
      odId: applications.odId,
      status: applications.status,
      practiceId: shifts.practiceId,
      practiceName: practices.name,
      startsAt: shifts.startsAt,
      endsAt: shifts.endsAt,
    })
    .from(applications)
    .innerJoin(shifts, eq(applications.shiftId, shifts.id))
    .innerJoin(practices, eq(practices.id, shifts.practiceId))
    .where(eq(applications.id, applicationId))
    .limit(1);
  if (!app) throw new Error("Application not found");
  if (
    app.practiceId !== session.user.practiceId &&
    session.user.role !== "admin"
  ) {
    throw new Error("Forbidden");
  }

  assertApplicationTransition(app.status, next as ApplicationStatus);

  await db
    .update(applications)
    .set({ status: next as ApplicationStatus, statusChangedAt: sql`now()` })
    .where(eq(applications.id, applicationId));

  // Concierge status ping: keep the OD in the loop when they're shortlisted or
  // explicitly passed over. Opt-in only — silent for ODs without concierge.
  // (Auto-decline because the shift was booked by someone else is a separate
  // ping fired from the booking actions, not this path.)
  if (next === "shortlisted" || next === "declined") {
    try {
      const [odUser] = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          conciergeOptedIn: users.conciergeOptedIn,
        })
        .from(users)
        .where(eq(users.odId, app.odId))
        .limit(1);
      if (odUser?.conciergeOptedIn) {
        const when = formatShiftWhen(app.startsAt, app.endsAt);
        const shortlisted = next === "shortlisted";
        await dispatchNotification({
          kind: "application_update",
          userId: odUser.id,
          recipientEmail: odUser.email,
          recipientPhone: odUser.phone ?? undefined,
          subject: shortlisted
            ? `You're a top candidate at ${app.practiceName}`
            : `Update on your application to ${app.practiceName}`,
          body: shortlisted
            ? `${app.practiceName} shortlisted your application for ${when}. They may book you next — keep an eye out.`
            : `${app.practiceName} won't be moving forward on ${when}. Plenty more shifts match your watch zones.`,
          actionUrl: `/shifts/${app.shiftId}`,
          actionLabel: "View shift",
          channels: ["push", "email"],
          payload: { shiftId: app.shiftId, applicationId, change: next },
        });
      }
    } catch (err) {
      console.error("[application-status] concierge ping failed:", err);
    }
  }
}

export async function boostShift(
  shiftId: string,
  input: { bumpRatePerHour: number },
) {
  const session = await requirePractice();

  const [row] = await db
    .select({
      id: shifts.id,
      practiceId: shifts.practiceId,
      status: shifts.status,
      rateCentsPerHour: shifts.rateCentsPerHour,
    })
    .from(shifts)
    .where(eq(shifts.id, shiftId))
    .limit(1);
  if (!row) return { ok: false as const, error: "Shift not found" };
  if (
    row.practiceId !== session.user.practiceId &&
    session.user.role !== "admin"
  ) {
    return { ok: false as const, error: "Forbidden" };
  }
  if (row.status !== "posted") {
    return {
      ok: false as const,
      error: "Only posted (unfilled) shifts can be boosted.",
    };
  }

  const bumpCents = Math.round(input.bumpRatePerHour * 100);
  if (!Number.isFinite(bumpCents) || bumpCents <= row.rateCentsPerHour) {
    return {
      ok: false as const,
      error: "Boosted rate must be higher than the current rate.",
    };
  }

  await db
    .update(shifts)
    .set({
      bumpRateCentsPerHour: bumpCents,
      bumpRadiusMeters: BUMP_RADIUS_METERS,
      bumpedAt: sql`now()`,
    })
    .where(and(eq(shifts.id, shiftId), eq(shifts.status, "posted")));

  try {
    await enqueueFanoutShiftBumped(shiftId);
  } catch (err) {
    console.error("[shift:boost] enqueue fanout failed:", err);
  }

  revalidatePath("/p/dashboard");
  revalidatePath(`/p/shifts/${shiftId}`);
  revalidatePath(`/shifts/${shiftId}`);

  return { ok: true as const };
}
