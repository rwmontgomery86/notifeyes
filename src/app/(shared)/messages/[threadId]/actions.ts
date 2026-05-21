"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  messages,
  threadParticipants,
  threads,
  users,
} from "@/db/schema";
import { dispatchNotification } from "@/lib/notifications";
import { requireSession } from "@/lib/auth/guards";

const sendSchema = z.object({
  body: z.string().min(1).max(4000),
});

export async function sendMessage(threadId: string, body: string) {
  const session = await requireSession();
  const parsed = sendSchema.safeParse({ body });
  if (!parsed.success) {
    return { ok: false as const, error: "Message too long or empty." };
  }

  // Must be a participant
  const [part] = await db
    .select()
    .from(threadParticipants)
    .where(
      and(
        eq(threadParticipants.threadId, threadId),
        eq(threadParticipants.userId, session.user.id),
      ),
    )
    .limit(1);
  if (!part) return { ok: false as const, error: "Not a participant" };

  await db.transaction(async (tx) => {
    await tx.insert(messages).values({
      threadId,
      senderUserId: session.user.id,
      body: parsed.data.body,
    });
    await tx
      .update(threads)
      .set({ lastMessageAt: sql`now()` })
      .where(eq(threads.id, threadId));
    // Bump unread counts for everyone else
    await tx
      .update(threadParticipants)
      .set({ unreadCount: sql`${threadParticipants.unreadCount} + 1` })
      .where(
        and(
          eq(threadParticipants.threadId, threadId),
          ne(threadParticipants.userId, session.user.id),
        ),
      );
  });

  // Notify counterparties (one in-app notification each)
  try {
    const others = await db
      .select({ userId: threadParticipants.userId, email: users.email })
      .from(threadParticipants)
      .innerJoin(users, eq(users.id, threadParticipants.userId))
      .where(
        and(
          eq(threadParticipants.threadId, threadId),
          ne(threadParticipants.userId, session.user.id),
        ),
      );
    await Promise.all(
      others.map((o) =>
        dispatchNotification({
          kind: "message_received",
          userId: o.userId,
          recipientEmail: o.email,
          subject: `New message from ${session.user.name ?? "NotifEyes"}`,
          body: parsed.data.body.slice(0, 140),
          actionUrl: `/messages/${threadId}`,
          channels: ["push"], // messages get push only; email firehose is for shift events
          payload: { threadId },
        }),
      ),
    );
  } catch (err) {
    console.error("[message:send] notify failed:", err);
  }

  return { ok: true as const };
}

export async function markThreadRead(threadId: string) {
  const session = await requireSession();
  await db
    .update(threadParticipants)
    .set({ unreadCount: 0, lastReadAt: sql`now()` })
    .where(
      and(
        eq(threadParticipants.threadId, threadId),
        eq(threadParticipants.userId, session.user.id),
      ),
    );
}
