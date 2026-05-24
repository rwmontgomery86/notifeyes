"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireSession } from "@/lib/auth/guards";

export async function markNotificationsRead() {
  const session = await requireSession();
  await db
    .update(notifications)
    .set({ readAt: sql`now()` })
    .where(
      and(
        eq(notifications.userId, session.user.id),
        isNull(notifications.readAt),
      ),
    );
  revalidatePath("/notifications");
  revalidatePath("/");
}

export async function markNotificationRead(id: string) {
  const session = await requireSession();
  await db
    .update(notifications)
    .set({ readAt: sql`now()` })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, session.user.id),
        isNull(notifications.readAt),
      ),
    );
  revalidatePath("/notifications");
  revalidatePath("/");
}

export async function deleteNotification(id: string) {
  const session = await requireSession();
  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, session.user.id),
      ),
    );
  revalidatePath("/notifications");
  revalidatePath("/");
}
