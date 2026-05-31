import "server-only";
import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications, threadParticipants } from "@/db/schema";

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
        ne(notifications.kind, "message_received"),
      ),
    );
  return row?.count ?? 0;
}

/**
 * The most recent unread notification (excluding messages, which have their own
 * surface). Powers the live toast in NotificationsLive — kind + actionUrl is
 * enough to render a "New shift match → View" prompt.
 */
export async function getLatestUnreadNotification(
  userId: string,
): Promise<{ id: string; kind: string; actionUrl: string | null } | null> {
  const [row] = await db
    .select({
      id: notifications.id,
      kind: notifications.kind,
      actionUrl: notifications.actionUrl,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
        ne(notifications.kind, "message_received"),
      ),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(1);
  return row ?? null;
}

export async function getUnreadMessagesCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`coalesce(sum(${threadParticipants.unreadCount}), 0)::int` })
    .from(threadParticipants)
    .where(eq(threadParticipants.userId, userId));
  return row?.count ?? 0;
}
