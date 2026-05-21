import webpush from "web-push";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { env } from "@/env";
import type { ChannelMessage, ChannelResult, NotificationChannel } from "../types";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  if (env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT,
      env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    );
    configured = true;
  }
}

/**
 * Web Push channel.
 *
 * Without VAPID keys: logs and returns ok=true (no-op in dev).
 * With VAPID + a stored subscription: sends a payload that the SW shows as a notification.
 */
export const pushChannel: NotificationChannel = {
  channel: "push",
  async send(msg: ChannelMessage): Promise<ChannelResult> {
    ensureConfigured();
    if (!configured) {
      console.log(`[push:stub] → user=${msg.recipientUserId} | ${msg.subject}`);
      return { channel: "push", ok: true, detail: "no-vapid" };
    }

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, msg.recipientUserId));

    if (subs.length === 0) {
      return { channel: "push", ok: true, detail: "no-subscription" };
    }

    const payload = JSON.stringify({
      title: msg.subject,
      body: msg.body,
      url: msg.actionUrl ?? "/",
      kind: msg.kind,
    });

    let sent = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        sent++;
      } catch (err) {
        const e = err as { statusCode?: number };
        if (e.statusCode === 410 || e.statusCode === 404) {
          // Subscription expired/gone — remove it
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
        } else {
          console.warn(`[push] send failed for sub ${sub.id}:`, err);
        }
      }
    }

    return { channel: "push", ok: sent > 0, detail: `sent ${sent}/${subs.length}` };
  },
};
