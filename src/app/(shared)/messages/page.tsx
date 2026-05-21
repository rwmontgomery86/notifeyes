import { eq, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  bookings,
  messages,
  optometrists,
  practices,
  threadParticipants,
  threads,
  users,
} from "@/db/schema";
import { relativeTime } from "@/lib/dates";

export const metadata = { title: "Messages · NotifEyes" };
export const dynamic = "force-dynamic";

export default async function MessagesIndex() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const rows = await getThreads(session.user.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold">Messages</h1>

      <div className="mt-6 grid gap-2">
        {rows.length === 0 ? (
          <div className="ne-card text-sm text-muted-foreground">
            No threads yet. They start automatically when you book a shift.
          </div>
        ) : null}
        {rows.map((r) => (
          <Link
            key={r.threadId}
            href={`/messages/${r.threadId}`}
            className="ne-card hover:border-primary transition-colors"
          >
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="font-medium">{r.counterpartyName}</div>
                <div className="text-xs text-muted-foreground">
                  {r.lastMessageBody ?? "(no messages yet)"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.unreadCount > 0 ? (
                  <span className="ne-pill bg-primary text-primary-foreground border-primary">
                    {r.unreadCount}
                  </span>
                ) : null}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {r.lastMessageAt ? relativeTime(r.lastMessageAt) : ""}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

async function getThreads(userId: string) {
  // Get all threads where this user participates, with counterparty + last message
  const result = await db.execute<{
    thread_id: string;
    last_message_at: Date | null;
    unread_count: number;
    counterparty_name: string;
    last_message_body: string | null;
  }>(sql`
    SELECT
      t.id AS thread_id,
      t.last_message_at,
      tp.unread_count,
      COALESCE(
        (
          SELECT m.body FROM messages m
          WHERE m.thread_id = t.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ),
        ''
      ) AS last_message_body,
      COALESCE(
        (
          SELECT u2.name FROM thread_participants tp2
          JOIN users u2 ON u2.id = tp2.user_id
          WHERE tp2.thread_id = t.id AND tp2.user_id <> ${userId}
          LIMIT 1
        ),
        '(direct)'
      ) AS counterparty_name
    FROM threads t
    JOIN thread_participants tp ON tp.thread_id = t.id AND tp.user_id = ${userId}
    ORDER BY t.last_message_at DESC NULLS LAST, t.created_at DESC
    LIMIT 50;
  `);

  return result.rows.map((r) => ({
    threadId: r.thread_id,
    lastMessageAt: r.last_message_at ? new Date(r.last_message_at) : null,
    unreadCount: r.unread_count,
    counterpartyName: r.counterparty_name,
    lastMessageBody: r.last_message_body ?? null,
  }));
}
