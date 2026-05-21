import { desc } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { relativeTime } from "@/lib/dates";

export const metadata = { title: "Notifications log · NotifEyes admin" };
export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const rows = await db
    .select({
      n: notifications,
      email: users.email,
    })
    .from(notifications)
    .innerJoin(users, eq(users.id, notifications.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(200);

  return (
    <div>
      <h1 className="text-2xl font-bold">Notifications log</h1>
      <p className="mt-1 text-muted-foreground">
        Dev-only view of every notification dispatched. SMS sends are stubbed
        (see server console for the simulated message body).
      </p>

      <div className="mt-6 grid gap-2">
        {rows.length === 0 ? (
          <div className="ne-card text-sm text-muted-foreground">
            No notifications yet.
          </div>
        ) : null}
        {rows.map(({ n, email }) => (
          <div key={n.id} className="ne-card">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{n.kind}</div>
                <div className="text-xs text-muted-foreground">
                  → {email} · channels: {n.channelsSent.length ? n.channelsSent.join(", ") : "in-app only"}
                  {n.actionUrl ? ` · ${n.actionUrl}` : ""}
                </div>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {relativeTime(n.createdAt)}
              </div>
            </div>
            {n.payload && Object.keys(n.payload as object).length > 0 ? (
              <pre className="mt-2 max-h-32 overflow-auto rounded border bg-secondary/30 p-2 text-xs">
                {JSON.stringify(n.payload, null, 2)}
              </pre>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
