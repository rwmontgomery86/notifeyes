import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { relativeTime } from "@/lib/dates";
import { NotificationsLive } from "@/components/NotificationsLive";
import { markNotificationsRead } from "./actions";

export const metadata = { title: "Notifications · NotifEyes" };
export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  watch_match: "New matching shift",
  invite_received: "Invite received",
  new_applicant: "New applicant",
  booking_confirmed: "Booking confirmed",
  shift_reminder: "Shift reminder",
  cancellation: "Shift cancelled",
  no_show_check: "No-show check",
  payout_sent: "Payout sent",
  review_request: "Time to leave a review",
  credential_expiring: "Credential expiring soon",
  verification_decided: "Verification update",
  message_received: "New message",
};

export default async function NotificationsInbox() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <NotificationsLive />

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
          return (
            <Link
              key={n.id}
              href={url}
              className={`ne-card transition-colors ${n.readAt ? "" : "border-primary/40"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {payload.zoneName ? `Zone: ${String(payload.zoneName)} · ` : ""}
                    sent on{" "}
                    {Array.isArray(n.channelsSent) && n.channelsSent.length
                      ? n.channelsSent.join(" · ")
                      : "in-app only"}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {relativeTime(n.createdAt)}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
