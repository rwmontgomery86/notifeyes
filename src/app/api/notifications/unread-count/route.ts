import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getUnreadNotificationCount,
  getUnreadMessagesCount,
} from "@/lib/notifications/unread";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight unread-count probe for the client-side polling fallback in
 * `NotificationsLive`. Postgres NOTIFY does not propagate through the Supabase
 * pooler to the SSE relay's pooled connection (see docs/launch-plan.md), so the
 * client polls this cheaply and calls `router.refresh()` only when the count
 * rises. SSE stays wired as an instant fast-path for environments where NOTIFY
 * delivery works (local dev, or a future direct-connection setup).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [notifications, messages] = await Promise.all([
    getUnreadNotificationCount(session.user.id),
    getUnreadMessagesCount(session.user.id),
  ]);

  return NextResponse.json(
    { notifications, messages, total: notifications + messages },
    { headers: { "Cache-Control": "no-store" } },
  );
}
