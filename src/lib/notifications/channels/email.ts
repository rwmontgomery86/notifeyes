import { env } from "@/env";
import type { ChannelMessage, ChannelResult, NotificationChannel } from "../types";

/**
 * Email channel.
 *
 *   - With RESEND_API_KEY set: real send via Resend HTTP API.
 *   - Without: logs to console (dev fallback). Mailpit users can swap to SMTP
 *     by setting RESEND_API_KEY="" and wiring nodemailer here; for V1 we
 *     keep the surface minimal and just log when no key is present.
 */
export const emailChannel: NotificationChannel = {
  channel: "email",
  async send(msg: ChannelMessage): Promise<ChannelResult> {
    if (!msg.recipientEmail) {
      return { channel: "email", ok: false, detail: "no recipient email" };
    }
    if (!env.RESEND_API_KEY) {
      console.log(
        `[email:console] → ${msg.recipientEmail} | ${msg.subject}\n${msg.body}\n`,
      );
      return { channel: "email", ok: true, detail: "console-only" };
    }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to: msg.recipientEmail,
          subject: msg.subject,
          text: msg.body + (msg.actionUrl ? `\n\nOpen: ${msg.actionUrl}` : ""),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { channel: "email", ok: false, detail: `resend ${res.status}: ${text}` };
      }
      return { channel: "email", ok: true };
    } catch (err) {
      return { channel: "email", ok: false, detail: String(err) };
    }
  },
};
