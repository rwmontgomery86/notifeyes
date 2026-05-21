"use server";

import { and, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  applications,
  favoriteOds,
  optometrists,
  practices,
  shifts,
  users,
} from "@/db/schema";
import { requirePractice } from "@/lib/auth/guards";
import { dispatchNotification } from "@/lib/notifications";
import { formatShiftWhen } from "@/lib/dates";
import { formatUsd } from "@/lib/pricing";

export async function searchOds(query: string): Promise<
  {
    id: string;
    name: string;
    displayName: string | null;
    ratingAvg: number | null;
    ratingCount: number;
    shiftsCompleted: number;
    isFavorite: boolean;
  }[]
> {
  const session = await requirePractice();
  const trimmed = query.trim();

  // Favorites first
  const favoriteIds = (
    await db
      .select({ odId: favoriteOds.odId })
      .from(favoriteOds)
      .where(eq(favoriteOds.practiceId, session.user.practiceId!))
  ).map((r) => r.odId);

  // Search verified ODs by name. If query is empty, return favorites + recent.
  const rows = await db
    .select({
      id: optometrists.id,
      name: optometrists.name,
      displayName: optometrists.displayName,
      ratingAvg: optometrists.ratingAvg,
      ratingCount: optometrists.ratingCount,
      shiftsCompleted: optometrists.shiftsCompleted,
    })
    .from(optometrists)
    .where(
      and(
        eq(optometrists.verificationStatus, "verified"),
        trimmed ? ilike(optometrists.name, `%${trimmed}%`) : sql`true`,
      ),
    )
    .limit(20);

  // Sort favorites to the top, then by rating desc
  rows.sort((a, b) => {
    const af = favoriteIds.includes(a.id) ? 1 : 0;
    const bf = favoriteIds.includes(b.id) ? 1 : 0;
    if (af !== bf) return bf - af;
    return (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0);
  });

  return rows.map((r) => ({
    ...r,
    isFavorite: favoriteIds.includes(r.id),
  }));
}

export async function inviteOds(
  shiftId: string,
  odIds: string[],
  contractBody: string,
) {
  const session = await requirePractice();
  if (odIds.length === 0) {
    return { ok: false as const, error: "No ODs selected" };
  }
  if (odIds.length > 25) {
    return { ok: false as const, error: "Invite up to 25 ODs at a time" };
  }
  // Stash the practice-signed contract body on the application's message
  // so it can be promoted to a Contract row when the OD accepts. The
  // `applications.message` field doubles as the practice's signed contract
  // bundle when source='invite'.
  //
  // (Cleaner long-term: a separate `contract_drafts` table. V1 keeps the
  // surface area small.)

  const [row] = await db
    .select({
      shift: shifts,
      practice: practices,
    })
    .from(shifts)
    .innerJoin(practices, eq(practices.id, shifts.practiceId))
    .where(eq(shifts.id, shiftId))
    .limit(1);
  if (!row) return { ok: false as const, error: "Shift not found" };
  if (
    row.shift.practiceId !== session.user.practiceId &&
    session.user.role !== "admin"
  ) {
    return { ok: false as const, error: "Forbidden" };
  }
  if (row.shift.status !== "posted") {
    return {
      ok: false as const,
      error: `Cannot invite — shift is ${row.shift.status}.`,
    };
  }

  // Confirm the ODs exist + are verified
  const odRows = await db
    .select({ id: optometrists.id, name: optometrists.name })
    .from(optometrists)
    .where(
      and(
        inArray(optometrists.id, odIds),
        eq(optometrists.verificationStatus, "verified"),
      ),
    );
  if (odRows.length === 0) {
    return { ok: false as const, error: "No matching verified ODs" };
  }

  // Skip any OD who already has an application on this shift
  const existing = await db
    .select({ odId: applications.odId })
    .from(applications)
    .where(
      and(
        eq(applications.shiftId, shiftId),
        inArray(applications.odId, odRows.map((o) => o.id)),
      ),
    );
  const existingOdIds = new Set(existing.map((e) => e.odId));
  const toInvite = odRows.filter((o) => !existingOdIds.has(o.id));
  if (toInvite.length === 0) {
    return {
      ok: false as const,
      error: "All selected ODs already have an application on this shift.",
    };
  }

  // Embed the signed contract body inside the application message envelope.
  // The accept handler reads it back when promoting to a Contract row.
  const inviteEnvelope = JSON.stringify({
    contractBody,
    signedByUserId: session.user.id,
    signedAt: new Date().toISOString(),
  });

  await db.insert(applications).values(
    toInvite.map((od) => ({
      shiftId,
      odId: od.id,
      source: "invite" as const,
      status: "offered" as const,
      message: inviteEnvelope,
    })),
  );

  // Notify each invited OD
  try {
    const odUserMap = new Map(
      (
        await db
          .select({ id: users.id, odId: users.odId, email: users.email, phone: users.phone })
          .from(users)
          .where(inArray(users.odId, toInvite.map((o) => o.id)))
      ).map((u) => [u.odId!, u]),
    );
    await Promise.all(
      toInvite.map((od) => {
        const u = odUserMap.get(od.id);
        if (!u) return Promise.resolve();
        return dispatchNotification({
          kind: "invite_received",
          userId: u.id,
          recipientEmail: u.email,
          recipientPhone: u.phone ?? undefined,
          subject: `${row.practice.name} invited you to a shift`,
          body: `${formatShiftWhen(row.shift.startsAt, row.shift.endsAt)} · ${formatUsd(row.shift.rateCentsPerHour)}/hr. Tap to accept or decline.`,
          actionUrl: `/shifts/${shiftId}`,
          channels: ["push", "email"],
          payload: { shiftId, practiceId: row.practice.id },
        });
      }),
    );
  } catch (err) {
    console.error("[invite] notify failed:", err);
  }

  return { ok: true as const, invited: toInvite.length };
}

export async function addFavoriteOd(odId: string) {
  const session = await requirePractice();
  await db
    .insert(favoriteOds)
    .values({
      practiceId: session.user.practiceId!,
      odId,
    })
    .onConflictDoNothing();
}

export async function removeFavoriteOd(odId: string) {
  const session = await requirePractice();
  await db
    .delete(favoriteOds)
    .where(
      and(
        eq(favoriteOds.practiceId, session.user.practiceId!),
        eq(favoriteOds.odId, odId),
      ),
    );
}
