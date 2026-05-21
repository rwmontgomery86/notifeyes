"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { optometrists, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { dispatchNotification } from "@/lib/notifications";

export async function decideVerification(
  odId: string,
  decision: "approve" | "reject",
  notes?: string,
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Forbidden");
  }

  await db
    .update(optometrists)
    .set({
      verificationStatus: decision === "approve" ? "verified" : "rejected",
      verifiedAt: decision === "approve" ? sql`now()` : null,
      verifiedByUserId: session.user.id,
      verificationNotes: notes || null,
    })
    .where(eq(optometrists.id, odId));

  // Find the OD's user account and notify them
  const [odUser] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.odId, odId))
    .limit(1);
  if (odUser) {
    try {
      await dispatchNotification({
        kind: "verification_decided",
        userId: odUser.id,
        recipientEmail: odUser.email,
        subject:
          decision === "approve"
            ? "You're verified — apply away."
            : "Verification update from NotifEyes",
        body:
          decision === "approve"
            ? "Your license is verified. The apply button on every shift is unlocked."
            : `We weren't able to verify your credentials yet. ${notes ? `Note: ${notes}` : "Please re-upload your documents from your profile."}`,
        actionUrl: decision === "approve" ? "/d/shifts" : "/d/profile",
        channels: ["push", "email"],
        payload: { decision, notes },
      });
    } catch (err) {
      console.error("[verification] notification failed:", err);
    }
  }
}
