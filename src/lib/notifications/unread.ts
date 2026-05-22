import "server-only";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
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

export async function getUnreadMessagesCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`coalesce(sum(${threadParticipants.unreadCount}), 0)::int` })
    .from(threadParticipants)
    .where(eq(threadParticipants.userId, userId));
  return row?.count ?? 0;
}
