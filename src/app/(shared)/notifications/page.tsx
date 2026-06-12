import { and, desc, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { relativeTime } from "@/lib/dates";
import { markNotificationsRead } from "./actions";
import { NotificationRow } from "./NotificationRow";

export const metadata = { title: "Notifications · NotifEyes" };
export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  watch_match: "New matching shift",
  invite_received: "Invite received",
  new_applicant: "New applicant",
  booking_confirmed: "Booking confirmed",
  shift_reminder: "Shift reminder",
  attendance_check: "Shift attendance",
  cancellation: "Shift cancelled",
  no_show_check: "No-show check",
  payout_sent: "Payout sent",
  review_request: "Time to leave a review",
  credential_expiring: "Credential expiring soon",
  verification_decided: "Verification update",
  message_received: "New message",
  application_update: "Application update",
  shift_unfilled: "Shift needs applicants",
};

export default async function NotificationsInbox() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const rows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, session.user.id),
        ne(notifications.kind, "message_received"),
      ),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <form action={markNotificationsRead}>
          <button type="submit" className="ne-btn-ghost text-sm">
            Mark all read
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-2">
        {rows.length === 0 ? (
          <div className="ne-card text-sm text-muted-foreground">
            No notifications yet. Set a watch zone and we&apos;ll ping you when
            matching shifts post.
          </div>
        ) : null}
        {rows.map((n) => {
          const url = n.actionUrl ?? "/";
          const label = KIND_LABELS[n.kind] ?? n.kind;
          const payload = n.payload as Record<string, unknown>;
          // "push" is the stubbed Web Push channel (deferred for beta) — don't
          // tell users we sent on a channel that doesn't reach them.
          const realChannels = Array.isArray(n.channelsSent)
            ? n.channelsSent.filter((c) => c !== "push")
            : [];
          const channels = realChannels.length
            ? realChannels.join(" · ")
            : "in-app only";
          const metaLine = `${payload.zoneName ? `Zone: ${String(payload.zoneName)} · ` : ""}sent on ${channels}`;
          return (
            <NotificationRow
              key={n.id}
              id={n.id}
              url={url}
              label={label}
              metaLine={metaLine}
              timeLabel={relativeTime(n.createdAt)}
              isUnread={!n.readAt}
            />
          );
        })}
      </div>
    </div>
  );
}
