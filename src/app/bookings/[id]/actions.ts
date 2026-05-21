"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, contracts } from "@/db/schema";
import { requireOd } from "@/lib/auth/guards";

export async function signContractAsOd(bookingId: string) {
  const session = await requireOd();
  const [booking] = await db
    .select({ id: bookings.id, odId: bookings.odId, contractId: bookings.contractId })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!booking) return { ok: false as const, error: "Booking not found" };
  if (booking.odId !== session.user.odId && session.user.role !== "admin") {
    return { ok: false as const, error: "Forbidden" };
  }
  if (!booking.contractId) {
    return { ok: false as const, error: "No contract on this booking" };
  }
  await db
    .update(contracts)
    .set({
      signedByOdAt: sql`now()`,
      signedByOdUserId: session.user.id,
    })
    .where(eq(contracts.id, booking.contractId));
  return { ok: true as const };
}
