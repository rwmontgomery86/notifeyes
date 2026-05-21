import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { emailChannel } from "./channels/email";
import { pushChannel } from "./channels/push";
import { smsChannel } from "./channels/sms";
import type { Channel, NotificationKind } from "./types";

const channels = {
  push: pushChannel,
  email: emailChannel,
  sms: smsChannel,
} as const;

export interface DispatchInput {
  kind: NotificationKind;
  userId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  subject: string;
  body: string;
  actionUrl?: string;
  channels: Channel[];
  payload?: Record<string, unknown>;
}

/**
 * Single-recipient dispatcher.
 *
 *   1. Writes a Notification row immediately (so the in-app inbox is updated
 *      even before any external send completes).
 *   2. Fires NOTIFY 'notification_inserted' so the SSE relay wakes connected
 *      clients.
 *   3. Sends across all requested channels concurrently. Records which ones
 *      succeeded on the notification row.
 */
export async function dispatchNotification(input: DispatchInput): Promise<void> {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      kind: input.kind,
      payload: input.payload ?? {},
      actionUrl: input.actionUrl ?? null,
    })
    .returning({ id: notifications.id });

  // Wake the SSE relay
  await db.execute(
    sql`SELECT pg_notify('notification_inserted', ${JSON.stringify({
      userId: input.userId,
      notificationId: row.id,
      kind: input.kind,
    })})`,
  );

  // Fire external channels
  const results = await Promise.all(
    input.channels.map((ch) =>
      channels[ch].send({
        kind: input.kind,
        recipientUserId: input.userId,
        recipientEmail: input.recipientEmail,
        recipientPhone: input.recipientPhone,
        subject: input.subject,
        body: input.body,
        actionUrl: input.actionUrl,
      }),
    ),
  );

  const sent = results.filter((r) => r.ok).map((r) => r.channel);

  await db
    .update(notifications)
    .set({ channelsSent: sent })
    .where(sql`id = ${row.id}`);
}
