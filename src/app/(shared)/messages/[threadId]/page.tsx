import { and, asc, eq, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
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
import { ThreadPane } from "./ThreadPane";
import { ThreadContextCard } from "./ThreadContextCard";
import { markThreadRead } from "./actions";
import { isUuid } from "@/lib/uuid";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  if (!isUuid(threadId)) notFound();
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  // Authorize participation
  const [part] = await db
    .select()
    .from(threadParticipants)
    .where(
      and(
        eq(threadParticipants.threadId, threadId),
        eq(threadParticipants.userId, userId),
      ),
    )
    .limit(1);
  if (!part) notFound();

  const [t] = await db
    .select({
      thread: threads,
      booking: bookings,
      shift_id: bookings.shiftId,
      practice_name: practices.name,
      practice_id: practices.id,
      od_id: optometrists.id,
      od_name: optometrists.name,
    })
    .from(threads)
    .leftJoin(bookings, eq(bookings.id, threads.contextBookingId))
    .leftJoin(practices, eq(practices.id, bookings.practiceId))
    .leftJoin(optometrists, eq(optometrists.id, bookings.odId))
    .where(eq(threads.id, threadId))
    .limit(1);
  if (!t) notFound();

  const counterparty = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(threadParticipants)
    .innerJoin(users, eq(users.id, threadParticipants.userId))
    .where(
      and(
        eq(threadParticipants.threadId, threadId),
        sql`${threadParticipants.userId} <> ${userId}`,
      ),
    );

  const msgs = await db
    .select({
      m: messages,
      sender: { id: users.id, name: users.name, role: users.role },
    })
    .from(messages)
    .leftJoin(users, eq(users.id, messages.senderUserId))
    .where(eq(messages.threadId, threadId))
    .orderBy(asc(messages.createdAt));

  // Mark read on visit
  await markThreadRead(threadId);

  // Resolve a per-side index URL for the back link
  const backHref = "/messages";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="grid gap-4 lg:grid-cols-[280px_1fr_280px] h-[80vh]">
        {/* Left: thread list (compact for V1 — just a back link + counterparty header) */}
        <aside className="ne-card overflow-y-auto">
          <Link
            href={backHref}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← All messages
          </Link>
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
              In this conversation
            </div>
            <div className="mt-2 text-sm space-y-1">
              {counterparty.map((c) => (
                <div key={c.id}>
                  <span className="font-medium">{c.name}</span>{" "}
                  <span className="text-xs text-muted-foreground capitalize">
                    {c.role?.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Middle: messages */}
        <ThreadPane
          threadId={threadId}
          messages={msgs.map(({ m, sender }) => ({
            id: m.id,
            body: m.body,
            attachments: m.attachments,
            createdAt: m.createdAt.toISOString(),
            isMe: m.senderUserId === userId,
            isSystem: !!m.systemKind,
            senderName: sender?.name ?? "",
          }))}
        />

        {/* Right: context */}
        <ThreadContextCard
          bookingId={t.thread.contextBookingId}
          shiftId={t.shift_id}
          practiceName={t.practice_name}
          practiceId={t.practice_id}
          odName={t.od_name}
          odId={t.od_id}
        />
      </div>
    </div>
  );
}
