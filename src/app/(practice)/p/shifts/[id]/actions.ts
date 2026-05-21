"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, shifts } from "@/db/schema";
import { requirePractice } from "@/lib/auth/guards";
import {
  assertApplicationTransition,
  type ApplicationStatus,
} from "@/lib/state/application";

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
      status: applications.status,
      practiceId: shifts.practiceId,
    })
    .from(applications)
    .innerJoin(shifts, eq(applications.shiftId, shifts.id))
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
}
