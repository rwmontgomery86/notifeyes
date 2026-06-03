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
import { requireVerifiedOd } from "@/lib/auth/guards";
import { computeShiftCost, formatUsd } from "@/lib/pricing";
import { buildContractBody, CONTRACT_TEMPLATE_VERSION } from "@/lib/contract";
import { assertApplicationTransition } from "@/lib/state/application";
import { assertShiftTransition } from "@/lib/state/shift";
import { payments } from "@/lib/payments";
import { dispatchNotification } from "@/lib/notifications";
import { formatShiftWhen } from "@/lib/dates";
import { formatAddress } from "@/lib/address";
import { shiftIcsAttachment } from "@/lib/calendar";
import { env } from "@/env";

/**
 * OD response to an invite (source='invite', status='offered').
 *
 * Decline: just flip status='declined'.
 *
 * Accept: this is the post-invite booking-creation path. It runs the same
 * sequence as the practice's "Confirm and book" action, except the practice
 * has already pre-signed at invite time, so we promote that signature onto
 * the new Contract row using the envelope stored in `applications.message`.
 */
export async function respondToInvite(
  applicationId: string,
  decision: "accept" | "decline",
) {
  const session = await requireVerifiedOd();
  const odId = session.user.odId!;

  const [row] = await db
    .select({
      application: applications,
      shift: shifts,
      practice: practices,
      od: optometrists,
    })
    .from(applications)
    .innerJoin(shifts, eq(shifts.id, applications.shiftId))
    .innerJoin(practices, eq(practices.id, shifts.practiceId))
    .innerJoin(optometrists, eq(optometrists.id, applications.odId))
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!row) return { ok: false as const, error: "Invite not found" };
  if (row.application.odId !== odId) {
    return { ok: false as const, error: "Forbidden" };
  }
  if (row.application.source !== "invite") {
    return { ok: false as const, error: "Not an invitation." };
  }
  if (row.application.status !== "offered") {
    return {
      ok: false as const,
      error: `Invitation is ${row.application.status}.`,
    };
  }
  if (row.shift.status !== "posted") {
    return {
      ok: false as const,
      error: `Shift is ${row.shift.status} — invite no longer valid.`,
    };
  }

  if (decision === "decline") {
    await db
      .update(applications)
      .set({ status: "declined", statusChangedAt: sql`now()` })
      .where(eq(applications.id, applicationId));
    // Notify the practice
    try {
      const [practiceUser] = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.id, row.shift.postedByUserId))
        .limit(1);
      if (practiceUser) {
        await dispatchNotification({
          kind: "new_applicant",
          userId: practiceUser.id,
          recipientEmail: practiceUser.email,
          subject: `${row.od.name} declined your invitation`,
          body: `${formatShiftWhen(row.shift.startsAt, row.shift.endsAt)} — your shift is still posted.`,
          actionUrl: `/p/shifts/${row.shift.id}`,
          channels: ["push", "email"],
          payload: { shiftId: row.shift.id, applicationId },
        });
      }
    } catch (err) {
      console.error("[invite:decline] notify failed:", err);
    }
    return { ok: true as const, bookingId: null };
  }

  // === Accept path ========================================================
  // Parse the practice's pre-signed envelope from the application message.
  let practiceSignedAt: string | null = null;
  let practiceSignedByUserId: string | null = null;
  try {
    if (row.application.message) {
      const parsed = JSON.parse(row.application.message) as {
        contractBody?: string;
        signedByUserId?: string;
        signedAt?: string;
      };
      practiceSignedByUserId = parsed.signedByUserId ?? null;
      practiceSignedAt = parsed.signedAt ?? null;
    }
  } catch {
    // No envelope (very old invites). Practice signs again via /bookings/:id.
  }

  const effectiveRate =
    row.shift.bumpRateCentsPerHour ?? row.shift.rateCentsPerHour;
  const cost = computeShiftCost({
    rateCentsPerHour: effectiveRate,
    startsAt: row.shift.startsAt,
    endsAt: row.shift.endsAt,
    lunchMinutes: row.shift.lunchMinutes,
    confirmedAt: new Date(),
    urgent: row.shift.urgent,
  });
  const matchFeeDisplay = cost.sameDay
    ? `${formatUsd(cost.feeCents)} (same-day)`
    : formatUsd(cost.feeCents);

  const finalContractBody = buildContractBody({
    practiceName: row.practice.name,
    odName: row.od.name,
    shiftStartsAt: row.shift.startsAt,
    shiftEndsAt: row.shift.endsAt,
    ratePerHour: formatUsd(effectiveRate),
    totalAmount: formatUsd(cost.totalCents),
    matchFee: matchFeeDisplay,
  });

  // Look up OD's user (for thread + their own confirmation/calendar invite)
  const [odUser] = await db
    .select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      conciergeOptedIn: users.conciergeOptedIn,
    })
    .from(users)
    .where(eq(users.odId, odId))
    .limit(1);

  let declinedOdIds: string[] = [];
  const bookingId = await db.transaction(async (tx) => {
    // Application → accepted
    assertApplicationTransition(row.application.status, "accepted");
    await tx
      .update(applications)
      .set({
        status: "accepted",
        statusChangedAt: sql`now()`,
        message: null, // clear the envelope; we've promoted it
      })
      .where(eq(applications.id, applicationId));

    // Shift → booked
    assertShiftTransition(row.shift.status, "booked");
    await tx
      .update(shifts)
      .set({ status: "booked", bookedApplicationId: applicationId })
      .where(eq(shifts.id, row.shift.id));

    // Decline any other pending applications on this shift. Capture whose, for
    // concierge "this shift filled" pings after the tx commits.
    declinedOdIds = (
      await tx
        .update(applications)
        .set({ status: "declined", statusChangedAt: sql`now()` })
        .where(
          sql`${applications.shiftId} = ${row.shift.id} AND ${applications.id} <> ${applicationId} AND ${applications.status} IN ('applied','shortlisted','offered')`,
        )
        .returning({ odId: applications.odId })
    ).map((d) => d.odId);

    // Booking + contract
    const [bookingRow] = await tx
      .insert(bookings)
      .values({
        shiftId: row.shift.id,
        odId,
        practiceId: row.shift.practiceId,
        applicationId,
        totalCents: cost.totalCents,
        platformFeeCents: cost.feeCents,
        status: "confirmed",
        paymentStatus: "authorizing",
      })
      .returning({ id: bookings.id });

    const [contract] = await tx
      .insert(contracts)
      .values({
        bookingId: bookingRow.id,
        templateVersion: CONTRACT_TEMPLATE_VERSION,
        bodyText: finalContractBody,
        signedByPracticeAt: practiceSignedAt
          ? sql`${practiceSignedAt}::timestamptz`
          : sql`now()`,
        signedByPracticeUserId: practiceSignedByUserId,
        // OD signs from /bookings/:id
      })
      .returning({ id: contracts.id });

    await tx
      .update(bookings)
      .set({ contractId: contract.id })
      .where(eq(bookings.id, bookingRow.id));

    // Thread bootstrap
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
        { threadId: t.id, userId: row.shift.postedByUserId },
        { threadId: t.id, userId: odUser.id },
      ]);
      const { messages } = await import("@/db/schema");
      await tx.insert(messages).values({
        threadId: t.id,
        body: "Booking confirmed via invitation. Sign the engagement to lock it in.",
        systemKind: "booking_confirmed",
        systemPayload: { bookingId: bookingRow.id, viaInvite: true },
      });
    }

    return bookingRow.id;
  });

  // Authorize payment (outside tx)
  try {
    const intent = await payments.createIntent({
      // Fee-only: authorize ONLY the match fee (wage is paid directly by the
      // practice). Captured when the practice confirms the OD showed up.
      amountCents: cost.practiceChargeCents,
      bookingId,
      practiceId: row.shift.practiceId,
      description: `NotifEyes match fee — invite booking #${bookingId.slice(0, 8)}`,
      captureMethod: "manual",
    });
    await db
      .update(bookings)
      .set({ paymentIntentId: intent.id, paymentStatus: intent.status })
      .where(eq(bookings.id, bookingId));
  } catch (err) {
    console.error("[invite:accept] payment auth failed:", err);
    await db
      .update(bookings)
      .set({ paymentStatus: "failed" })
      .where(eq(bookings.id, bookingId));
  }

  // Notify the practice that the invite was accepted
  try {
    const [practiceUser] = await db
      .select({
        id: users.id,
        email: users.email,
        conciergeOptedIn: users.conciergeOptedIn,
      })
      .from(users)
      .where(eq(users.id, row.shift.postedByUserId))
      .limit(1);
    if (practiceUser) {
      const appBase = env.AUTH_URL?.replace(/\/$/, "") ?? "";
      await dispatchNotification({
        kind: "booking_confirmed",
        userId: practiceUser.id,
        recipientEmail: practiceUser.email,
        subject: `${row.od.name} accepted — booking locked in`,
        body: `${formatShiftWhen(row.shift.startsAt, row.shift.endsAt)} · ${formatUsd(effectiveRate)}/hr. They&apos;ll sign the engagement next.`,
        actionUrl: `/bookings/${bookingId}`,
        channels: ["push", "email"],
        payload: { bookingId, shiftId: row.shift.id, viaInvite: true },
        attachments: practiceUser.conciergeOptedIn
          ? [
              shiftIcsAttachment({
                bookingId,
                practiceName: row.practice.name,
                start: row.shift.startsAt,
                end: row.shift.endsAt,
                location: formatAddress(row.practice) || undefined,
                url: appBase ? `${appBase}/bookings/${bookingId}` : undefined,
              }),
            ]
          : undefined,
      });
    }
  } catch (err) {
    console.error("[invite:accept] notify failed:", err);
  }

  // Concierge extra: the OD just self-accepted, so a plain "you're booked" email
  // would be noise — but if they opted into concierge, send them a confirmation
  // carrying the .ics calendar invite. Gated entirely on concierge so default
  // behavior (no OD email on self-accept) is unchanged.
  try {
    if (odUser?.conciergeOptedIn) {
      const appBase = env.AUTH_URL?.replace(/\/$/, "") ?? "";
      await dispatchNotification({
        kind: "booking_confirmed",
        userId: odUser.id,
        recipientEmail: odUser.email,
        recipientPhone: odUser.phone ?? undefined,
        subject: `Booking confirmed · ${row.practice.name}`,
        body: `${formatShiftWhen(row.shift.startsAt, row.shift.endsAt)} · ${formatUsd(effectiveRate)}/hr. Sign the engagement on the booking page.`,
        actionUrl: `/bookings/${bookingId}`,
        channels: ["push", "email"],
        payload: { bookingId, shiftId: row.shift.id, role: "od", viaInvite: true },
        attachments: [
          shiftIcsAttachment({
            bookingId,
            practiceName: row.practice.name,
            start: row.shift.startsAt,
            end: row.shift.endsAt,
            location: formatAddress(row.practice) || undefined,
            url: appBase ? `${appBase}/bookings/${bookingId}` : undefined,
          }),
        ],
      });
    }
  } catch (err) {
    console.error("[invite:accept] OD concierge notify failed:", err);
  }

  // Concierge status ping: any other applicants on this shift were just
  // declined because the invited OD accepted — let them know it filled. Opt-in.
  if (declinedOdIds.length) {
    try {
      const when = formatShiftWhen(row.shift.startsAt, row.shift.endsAt);
      for (const declinedOdId of declinedOdIds) {
        const [u] = await db
          .select({
            id: users.id,
            email: users.email,
            phone: users.phone,
            conciergeOptedIn: users.conciergeOptedIn,
          })
          .from(users)
          .where(eq(users.odId, declinedOdId))
          .limit(1);
        if (!u?.conciergeOptedIn) continue;
        await dispatchNotification({
          kind: "application_update",
          userId: u.id,
          recipientEmail: u.email,
          recipientPhone: u.phone ?? undefined,
          subject: "A shift you applied to was filled",
          body: `${when} at ${row.practice.name} was just booked by another optometrist. We'll keep watching your zones for the next match.`,
          actionUrl: `/d/shifts`,
          actionLabel: "Find more shifts",
          channels: ["push", "email"],
          payload: { shiftId: row.shift.id, change: "filled_elsewhere" },
        });
      }
    } catch (err) {
      console.error("[invite:accept] filled-elsewhere ping failed:", err);
    }
  }

  return { ok: true as const, bookingId };
}
