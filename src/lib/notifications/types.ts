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

export interface ChannelMessage {
  kind: NotificationKind;
  recipientUserId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  subject: string;
  body: string;
  actionUrl?: string;
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
