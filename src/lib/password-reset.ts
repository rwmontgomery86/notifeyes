import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets, users } from "@/db/schema";
import { emailChannel } from "@/lib/notifications/channels/email";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Per-account ceiling on reset emails within one TTL window. Caps the spam a
// stranger can aim at someone's inbox by hammering /forgot-password.
export const MAX_RESET_REQUESTS_PER_WINDOW = 3;

// Only the hash hits the DB — the raw token exists solely in the emailed link.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Create a reset token for the account behind `email` (if any) and send the
 * reset link. Resolves identically whether or not the account exists —
 * callers must not branch on the outcome (no account enumeration).
 *
 * Sends via the email channel directly, NOT dispatchNotification: a reset
 * email is transactional (a locked-out user can't read the in-app inbox),
 * so it skips the notification row and the emailOptedIn gate.
 */
export async function createAndSendPasswordReset(emailRaw: string): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) return;

  // Rate limit: count this account's requests (used or not) inside the last
  // TTL window and go quiet past the cap. Suppression is server-side only —
  // the caller's neutral response never changes.
  const [recent] = await db
    .select({ n: count() })
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.userId, user.id),
        gt(passwordResets.createdAt, new Date(Date.now() - RESET_TOKEN_TTL_MS)),
      ),
    );
  if ((recent?.n ?? 0) >= MAX_RESET_REQUESTS_PER_WINDOW) {
    console.warn(
      `[password-reset] rate limit: user ${user.id} has ${recent.n} requests in the last hour — not sending`,
    );
    return;
  }

  const token = randomBytes(32).toString("base64url");
  await db.insert(passwordResets).values({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });

  await emailChannel.send({
    kind: "password_reset",
    recipientUserId: user.id,
    recipientEmail: user.email,
    subject: "Reset your NotifEyes password",
    body:
      `Someone (hopefully you) asked to reset the password for ${user.email}. ` +
      `The link below expires in 1 hour and can be used once.\n\n` +
      `If you didn't ask for this, ignore this email — your password is unchanged.`,
    actionUrl: `/reset-password/${token}`,
    actionLabel: "Reset password",
  });
}

/** Look up a raw token. Null if unknown, already used, or expired. */
export async function findValidReset(
  token: string,
): Promise<{ userId: string } | null> {
  if (!token || token.length > 200) return null;
  const [row] = await db
    .select({ userId: passwordResets.userId })
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.tokenHash, hashToken(token)),
        isNull(passwordResets.usedAt),
        gt(passwordResets.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Set the user's password and burn the token. The guarded UPDATE … RETURNING
 * re-checks validity atomically, so a token can't be redeemed twice in a
 * race. Also voids the user's other outstanding tokens. False = token was no
 * longer valid.
 */
export async function consumeResetAndSetPassword(
  token: string,
  passwordHash: string,
): Promise<boolean> {
  if (!token || token.length > 200) return false;
  return db.transaction(async (tx) => {
    const now = new Date();
    const [row] = await tx
      .update(passwordResets)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResets.tokenHash, hashToken(token)),
          isNull(passwordResets.usedAt),
          gt(passwordResets.expiresAt, now),
        ),
      )
      .returning({ userId: passwordResets.userId });
    if (!row) return false;

    await tx.update(users).set({ passwordHash }).where(eq(users.id, row.userId));
    await tx
      .update(passwordResets)
      .set({ usedAt: now })
      .where(and(eq(passwordResets.userId, row.userId), isNull(passwordResets.usedAt)));
    return true;
  });
}
