export type NotificationKind =
  | "watch_match"
  | "invite_received"
  | "new_applicant"
  | "booking_confirmed"
  | "shift_reminder"
  | "attendance_check"
  | "cancellation"
  | "no_show_check"
  | "payout_sent"
  | "review_request"
  | "credential_expiring"
  | "verification_decided"
  | "message_received";

export type Channel = "push" | "email" | "sms";

/**
 * A file to attach to rich channels (email only today). `content` is the raw
 * UTF-8 file body — the channel handles transport encoding (e.g. base64 for
 * Resend). Used for .ics calendar invites on booking confirmation.
 */
export interface EmailAttachment {
  filename: string;
  content: string;
  contentType?: string;
}

export interface ChannelMessage {
  kind: NotificationKind;
  recipientUserId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  subject: string;
  body: string;
  actionUrl?: string;
  /** CTA button label for rich channels (email). Defaults to "View details". */
  actionLabel?: string;
  /** Attachments for rich channels. Ignored by push/sms. */
  attachments?: EmailAttachment[];
}

export interface ChannelResult {
  channel: Channel;
  ok: boolean;
  detail?: string;
}

export interface NotificationChannel {
  channel: Channel;
  send(msg: ChannelMessage): Promise<ChannelResult>;
}
