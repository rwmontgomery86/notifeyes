import { env } from "@/env";
import type { ChannelMessage, ChannelResult, NotificationChannel } from "../types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Resolve a (possibly relative) actionUrl to an absolute one for email links.
// AUTH_URL is the app origin in prod; if unset (some local dev) fall back to the
// relative path rather than emitting a broken absolute link.
function absoluteUrl(actionUrl?: string): string | undefined {
  if (!actionUrl) return undefined;
  if (/^https?:\/\//.test(actionUrl)) return actionUrl;
  const base = env.AUTH_URL?.replace(/\/$/, "") ?? "";
  return base ? `${base}${actionUrl}` : actionUrl;
}

// Minimal, email-client-safe HTML: inline styles, table layout, one CTA button.
function renderHtml(msg: ChannelMessage, url?: string): string {
  const safeBody = escapeHtml(msg.body).replace(/\n/g, "<br>");
  const label = escapeHtml(msg.actionLabel ?? "View details");
  const button = url
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-radius:8px;background:#4f46e5;"><a href="${escapeHtml(
        url,
      )}" style="display:inline-block;padding:12px 24px;font-weight:600;font-size:15px;color:#ffffff;text-decoration:none;">${label}</a></td></tr></table>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f5f5f7;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#ffffff;border-radius:12px;padding:28px;">
<tr><td style="font-weight:700;font-size:18px;color:#4f46e5;padding-bottom:16px;">NotifEyes</td></tr>
<tr><td style="font-size:18px;font-weight:600;padding-bottom:8px;line-height:1.3;">${escapeHtml(msg.subject)}</td></tr>
<tr><td style="font-size:14px;line-height:1.6;color:#3f3f46;">${safeBody}</td></tr>
<tr><td>${button}</td></tr>
<tr><td style="font-size:12px;color:#a1a1aa;padding-top:20px;border-top:1px solid #ececf0;">You're receiving this because you turned on NotifEyes alerts. Manage notifications in your profile.</td></tr>
</table></td></tr></table></body></html>`;
}

/**
 * Email channel.
 *
 *   - With RESEND_API_KEY set: real send via Resend HTTP API (rich HTML + text
 *     fallback, with an absolute CTA link).
 *   - Without: logs to console (dev fallback).
 */
export const emailChannel: NotificationChannel = {
  channel: "email",
  async send(msg: ChannelMessage): Promise<ChannelResult> {
    if (!msg.recipientEmail) {
      return { channel: "email", ok: false, detail: "no recipient email" };
    }
    const url = absoluteUrl(msg.actionUrl);
    if (!env.RESEND_API_KEY) {
      console.log(
        `[email:console] → ${msg.recipientEmail} | ${msg.subject}\n${msg.body}${
          url ? `\n${msg.actionLabel ?? "Open"}: ${url}` : ""
        }\n`,
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
          text: msg.body + (url ? `\n\n${msg.actionLabel ?? "Open"}: ${url}` : ""),
          html: renderHtml(msg, url),
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
