"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { payouts, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { dispatchNotification } from "@/lib/notifications";
import { formatUsd } from "@/lib/pricing";

export async function markPayoutSent(payoutId: string) {
  const session = await requireAdmin();
  const [p] = await db
    .select()
    .from(payouts)
    .where(eq(payouts.id, payoutId))
    .limit(1);
  if (!p) return;

  await db
    .update(payouts)
    .set({
      status: "sent",
      sentAt: sql`now()`,
      markedSentByUserId: session.user.id,
    })
    .where(eq(payouts.id, payoutId));

  // Notify the OD their money is on the way
  try {
    const [odUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.odId, p.odId))
      .limit(1);
    if (odUser) {
      await dispatchNotification({
        kind: "payout_sent",
        userId: odUser.id,
        recipientEmail: odUser.email,
        subject: `Payout sent · ${formatUsd(p.amountCents)}`,
        body: `Your payout of ${formatUsd(p.amountCents)} has been initiated and should arrive within 1–3 business days.`,
        channels: ["push", "email"],
        payload: { payoutId },
      });
    }
  } catch (err) {
    console.error("[payouts] notify failed:", err);
  }
}

export async function markPayoutFailed(payoutId: string) {
  await requireAdmin();
  await db
    .update(payouts)
    .set({ status: "failed" })
    .where(eq(payouts.id, payoutId));
}
