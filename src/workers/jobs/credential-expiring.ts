/**
 * Daily scan: any OD whose license expires within the next 30 days and we
 * haven't notified them about *this specific* expiry date.
 *
 * Per §7 of the brief — `credential_expiring` notification, email + in-app
 * channels (no SMS — not urgent enough).
 *
 * Dedup: payload.licenseExpiresAt is the timestamp we're warning about.
 * If the OD renews and a new expiry is set, we'll notify again because the
 * payload key won't match.
 */

import { and, eq, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications, optometrists, users } from "@/db/schema";
import { dispatchNotification } from "@/lib/notifications";

export async function credentialExpiringScan(): Promise<void> {
  const candidates = await db
    .select({
      odId: optometrists.id,
      name: optometrists.name,
      licenseExpiresAt: optometrists.licenseExpiresAt,
      licenseState: optometrists.licenseState,
      licenseNumber: optometrists.licenseNumber,
    })
    .from(optometrists)
    .where(
      and(
        eq(optometrists.verificationStatus, "verified"),
        isNotNull(optometrists.licenseExpiresAt),
        lte(optometrists.licenseExpiresAt, sql`now() + interval '30 days'`),
        sql`${optometrists.licenseExpiresAt} > now()`, // already-expired handled by admin
      ),
    );

  for (const c of candidates) {
    if (!c.licenseExpiresAt) continue;
    const expiryIso = c.licenseExpiresAt.toISOString();

    // Look up the OD's user account
    const [odUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.odId, c.odId))
      .limit(1);
    if (!odUser) continue;

    // Have we already notified about this exact expiry?
    const [already] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, odUser.id),
          eq(notifications.kind, "credential_expiring"),
          sql`${notifications.payload}->>'licenseExpiresAt' = ${expiryIso}`,
        ),
      )
      .limit(1);
    if (already) continue;

    const daysOut = Math.ceil(
      (c.licenseExpiresAt.getTime() - Date.now()) / 86_400_000,
    );

    await dispatchNotification({
      kind: "credential_expiring",
      userId: odUser.id,
      recipientEmail: odUser.email,
      subject: `Your ${c.licenseState} license expires in ${daysOut} days`,
      body: `License ${c.licenseState} #${c.licenseNumber ?? "—"} expires ${c.licenseExpiresAt.toLocaleDateString()}. Renew with your state board and upload the new license to your NotifEyes profile to keep applying to shifts.`,
      actionUrl: "/d/profile",
      // No SMS for credential warnings — not time-critical
      channels: ["push", "email"],
      payload: {
        licenseExpiresAt: expiryIso,
        licenseState: c.licenseState,
        daysOut,
      },
    });
  }

  if (candidates.length) {
    console.log(
      `[credential-expiring] scanned ${candidates.length} OD(s) with licenses within 30 days`,
    );
  }
}
