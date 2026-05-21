"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  applications,
  bookings,
  contracts,
  optometrists,
  practices,
  shifts,
  threadParticipants,
  threads,
  users,
} from "@/db/schema";
import { requirePractice } from "@/lib/auth/guards";
import { computeShiftCost, formatUsd } from "@/lib/pricing";
import { CONTRACT_TEMPLATE_VERSION } from "@/lib/contract";
import { assertApplicationTransition } from "@/lib/state/application";
import { assertShiftTransition } from "@/lib/state/shift";
import { payments } from "@/lib/payments";
import { dispatchNotification } from "@/lib/notifications";
import { formatShiftWhen } from "@/lib/dates";

/**
 * Atomic flow:
 *   1. Verify application is in 'applied' or 'shortlisted' (or 'offered' — invite path)
 *   2. Compute cost
 *   3. Create Contract row (with frozen body text + practice sig timestamp)
 *   4. Create Booking row pointing at contract
 *   5. Move Application → 'accepted'
 *   6. Move Shift → 'booked'
 *   7. Decline all other applications on this shift
 *   8. Authorize PaymentIntent via stub (or real Stripe later)
 *   9. Create thread between practice owner + OD user, pinned to booking
 *
 * Wrapped in a single DB transaction. The payment authorization happens AFTER
 * the commit so a payment failure doesn't bork the DB state — we instead mark
 * paymentStatus='failed' on the booking and the practice retries.
 */
export async function confirmBooking(
  applicationId: string,
  contractBody: string,
) {
  const session = await requirePractice();
  const practiceId = session.user.practiceId!;

  // === Phase 1: load everything we need, then mutate inside a tx ============
  const [row] = await db
    .select({
      application: applications,
      shift: shifts,
      od: optometrists,
      practice: practices,
    })
    .from(applications)
    .innerJoin(shifts, eq(applications.shiftId, shifts.id))
    .innerJoin(optometrists, eq(applications.odId, optometrists.id))
    .innerJoin(practices, eq(shifts.practiceId, practices.id))
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!row) return { ok: false as const, error: "Application not found" };
  if (row.shift.practiceId !== practiceId && session.user.role !== "admin") {
    return { ok: false as const, error: "Forbidden" };
  }
  if (row.shift.status !== "posted") {
    return {
      ok: false as const,
      error: `Shift is already ${row.shift.status} and cannot be booked.`,
    };
  }
  // Allow accept from applied / shortlisted / offered
  if (
    row.application.status !== "applied" &&
    row.application.status !== "shortlisted" &&
    row.application.status !== "offered"
  ) {
    return {
      ok: false as const,
      error: `Application is ${row.application.status} and cannot be accepted.`,
    };
  }

  // Look up the OD's user account (for the message thread)
  const [odUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.odId, row.od.id))
    .limit(1);

  const cost = computeShiftCost({
    rateCentsPerHour: row.shift.rateCentsPerHour,
    startsAt: row.shift.startsAt,
    endsAt: row.shift.endsAt,
    lunchMinutes: row.shift.lunchMinutes,
  });

  // === Phase 2: db tx ======================================================
  const bookingId = await db.transaction(async (tx) => {
    // Application → accepted
    assertApplicationTransition(row.application.status, "accepted");
    await tx
      .update(applications)
      .set({ status: "accepted", statusChangedAt: sql`now()` })
      .where(eq(applications.id, applicationId));

    // Decline all other applications for this shift
    await tx
      .update(applications)
      .set({ status: "declined", statusChangedAt: sql`now()` })
      .where(
        sql`${applications.shiftId} = ${row.shift.id} AND ${applications.id} <> ${applicationId} AND ${applications.status} IN ('applied','shortlisted','offered')`,
      );

    // Shift → booked
    assertShiftTransition(row.shift.status, "booked");
    await tx
      .update(shifts)
      .set({ status: "booked" })
      .where(eq(shifts.id, row.shift.id));

    // Booking — insert first since contracts.booking_id has a NOT NULL FK
    const [bookingRow] = await tx
      .insert(bookings)
      .values({
        shiftId: row.shift.id,
        odId: row.od.id,
        practiceId: row.shift.practiceId,
        applicationId,
        totalCents: cost.totalCents,
        platformFeeCents: cost.feeCents,
        status: "confirmed",
        paymentStatus: "authorizing",
      })
      .returning({ id: bookings.id });

    // Contract — practice signs at moment of confirmation
    const [contract] = await tx
      .insert(contracts)
      .values({
        bookingId: bookingRow.id,
        templateVersion: CONTRACT_TEMPLATE_VERSION,
        bodyText: contractBody,
        signedByPracticeAt: sql`now()`,
        signedByPracticeUserId: session.user.id,
        // OD signs from /bookings/:id page
      })
      .returning({ id: contracts.id });

    await tx
      .update(bookings)
      .set({ contractId: contract.id })
      .where(eq(bookings.id, bookingRow.id));

    // Update shift's booked_application_id
    await tx
      .update(shifts)
      .set({ bookedApplicationId: applicationId })
      .where(eq(shifts.id, row.shift.id));

    // Thread bootstrap (booking-scoped 1:1)
    if (odUser) {
      const [t] = await tx
        .insert(threads)
        .values({
          contextBookingId: bookingRow.id,
          contextShiftId: row.shift.id,
          lastMessageAt: sql`now()`,
        })
        .returning({ id: threads.id });
      await tx.insert(threadParticipants).values([
        { threadId: t.id, userId: session.user.id },
        { threadId: t.id, userId: odUser.id },
      ]);
      // System message — booking confirmed
      const { messages } = await import("@/db/schema");
      await tx.insert(messages).values({
        threadId: t.id,
        body: "Booking confirmed. The OD will sign the engagement on the booking page.",
        systemKind: "booking_confirmed",
        systemPayload: { bookingId: bookingRow.id },
      });
    }

    return bookingRow.id;
  });

  // === Phase 3: payment authorization (outside tx) =========================
  try {
    const intent = await payments.createIntent({
      amountCents: cost.totalCents,
      bookingId,
      practiceId,
      description: `NotifEyes shift booking #${bookingId.slice(0, 8)}`,
      captureMethod: "manual",
    });
    await db
      .update(bookings)
      .set({
        paymentIntentId: intent.id,
        paymentStatus: intent.status,
      })
      .where(eq(bookings.id, bookingId));
  } catch (err) {
    console.error("[book] payment auth failed:", err);
    await db
      .update(bookings)
      .set({ paymentStatus: "failed" })
      .where(eq(bookings.id, bookingId));
    // V1: don't roll back the booking — practice can retry payment from
    // /bookings/:id. The booking is still valid for messaging / cancellation.
  }

  // Dispatch booking_confirmed to both parties (in-app + email + push)
  try {
    if (odUser) {
      const odUserRow = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, odUser.id),
      });
      await dispatchNotification({
        kind: "booking_confirmed",
        userId: odUser.id,
        recipientEmail: odUserRow?.email,
        recipientPhone: odUserRow?.phone ?? undefined,
        subject: `Booking confirmed · ${row.practice.name}`,
        body: `${formatShiftWhen(row.shift.startsAt, row.shift.endsAt)} · ${formatUsd(row.shift.rateCentsPerHour)}/hr. Sign the engagement on the booking page.`,
        actionUrl: `/bookings/${bookingId}`,
        channels: ["push", "email"],
        payload: { bookingId, shiftId: row.shift.id, role: "od" },
      });
    }
    await dispatchNotification({
      kind: "booking_confirmed",
      userId: session.user.id,
      recipientEmail: session.user.email!,
      subject: `Booking confirmed with ${row.od.name}`,
      body: `${formatShiftWhen(row.shift.startsAt, row.shift.endsAt)} · ${formatUsd(row.shift.rateCentsPerHour)}/hr. Practice charge: ${formatUsd(cost.totalCents)}.`,
      actionUrl: `/bookings/${bookingId}`,
      channels: ["push", "email"],
      payload: { bookingId, shiftId: row.shift.id, role: "practice" },
    });
  } catch (err) {
    console.error("[book] notification dispatch failed:", err);
  }

  return { ok: true as const, bookingId };
}
