import { env } from "@/env";
import type { ChannelMessage, ChannelResult, NotificationChannel } from "../types";

/**
 * SMS channel.
 *
 *   - With TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER set:
 *     real send via the Twilio REST API.
 *   - Without: logs to the server console (the locked-decision V1 stub). The
 *     parent fanout job writes the notification row that aggregates
 *     channels_sent; this adapter just sends (or logs).
 */

const sid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;
const fromNumber = env.TWILIO_FROM_NUMBER;
const twilioConfigured = Boolean(sid && authToken && fromNumber);

export const smsChannel: NotificationChannel = {
  channel: "sms",
  async send(msg: ChannelMessage): Promise<ChannelResult> {
    if (!twilioConfigured) {
      console.log(
        `[sms:stub] → ${msg.recipientPhone ?? "(no phone)"} | ${msg.kind} | ${msg.subject}: ${msg.body}`,
      );
      return { channel: "sms", ok: true, detail: "stub-console" };
    }

    if (!msg.recipientPhone) {
      return { channel: "sms", ok: false, detail: "no recipient phone" };
    }

    const body =
      (msg.subject ? `${msg.subject}: ${msg.body}` : msg.body) +
      (msg.actionUrl ? `\n${msg.actionUrl}` : "");

    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            // Basic auth: AccountSID:AuthToken. btoa is runtime-agnostic.
            Authorization: `Basic ${btoa(`${sid}:${authToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: msg.recipientPhone,
            From: fromNumber as string,
            Body: body,
          }),
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!res.ok) {
        const detail = await res.text();
        return {
          channel: "sms",
          ok: false,
          detail: `twilio ${res.status}: ${detail}`,
        };
      }
      return { channel: "sms", ok: true };
    } catch (err) {
      return { channel: "sms", ok: false, detail: String(err) };
    }
  },
};
