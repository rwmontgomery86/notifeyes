import { db } from "@/db";
import { notifications } from "@/db/schema";
import type { ChannelMessage, ChannelResult, NotificationChannel } from "../types";

/**
 * SMS — stubbed in V1 per the locked decision.
 *
 * Logs to the server console and writes a notification row marked
 * channels_sent=['sms_stub'] so the dev /admin/notifications page can show
 * what would have been sent. Swap for Twilio later behind this same interface.
 */
export const smsChannel: NotificationChannel = {
  channel: "sms",
  async send(msg: ChannelMessage): Promise<ChannelResult> {
    console.log(
      `[sms:stub] → ${msg.recipientPhone ?? "(no phone)"} | ${msg.kind} | ${msg.subject}: ${msg.body}`,
    );
    // We don't write a separate row — the parent fanout job writes one row
    // per recipient that aggregates channels_sent. This adapter just logs.
    return { channel: "sms", ok: true, detail: "stub-console" };
  },
};
